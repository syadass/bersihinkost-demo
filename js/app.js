/* =============================================================================
 * Bersihinkost DEMO — Router (hash-based SPA)
 * Rute:
 *   #/                       Beranda publik
 *   #/sukses/:id             Halaman sukses pesanan
 *   #/login                  Login pengelola
 *   #/lupa-sandi             Lupa kata sandi
 *   #/reset-sandi/:token     Reset kata sandi
 *   #/admin                  Dashboard
 *   #/admin/pesanan          Daftar pesanan
 *   #/admin/pesanan/laporan  Laporan pemasukan
 *   #/admin/pesanan/:id      Detail pesanan
 *   #/admin/pesanan/:id/edit Ubah pesanan
 *   #/admin/pesanan/:id/invoice  Invoice
 *   #/admin/layanan          Kelola layanan
 *   #/admin/pengaturan       Pengaturan sistem
 * ========================================================================== */
(function (global) {
    'use strict';

    const appEl = () => document.getElementById('app');

    let current = null;      // view aktif (punya destroy?)
    let pendingFlash = null; // toast yang menunggu render berikutnya

    /** Parse "#/path?query" -> { segments: [...], query: {...} } */
    function parseHash() {
        let h = location.hash || '';
        if (h.startsWith('#')) h = h.slice(1);
        if (!h.startsWith('/')) h = '/' + h;
        const qi = h.indexOf('?');
        const path = qi >= 0 ? h.slice(0, qi) : h;
        const query = {};
        if (qi >= 0) {
            new URLSearchParams(h.slice(qi + 1)).forEach((v, k) => { query[k] = v; });
        }
        const segments = path.split('/').filter(Boolean);
        return { segments, query };
    }

    function adminGuard() {
        if (!Store.currentUser()) {
            location.replace('#/login');
            return false;
        }
        return true;
    }

    /** Pilih view berdasarkan rute */
    function resolve() {
        const { segments, query } = parseHash();
        const [a, b, c, d] = segments;

        /* ------------------------- halaman publik ------------------------- */
        if (!a) return PagesPublic.renderHome();
        if (a === 'sukses' && b) return PagesPublic.renderSuccess({ id: Number(b) });

        /* ---------------------------- auth -------------------------------- */
        if (a === 'login') {
            if (Store.currentUser()) { location.replace('#/admin'); return null; }
            return PagesAuth.renderLogin(query);
        }
        if (a === 'lupa-sandi') return PagesAuth.renderForgot();
        if (a === 'reset-sandi' && b) return PagesAuth.renderReset({ token: b }, query);

        /* --------------------------- dashboard ---------------------------- */
        if (a === 'admin' && !b) {
            if (!adminGuard()) return null;
            return PagesDashboard.renderDashboard(query);
        }

        /* --------------------------- pesanan ------------------------------ */
        if (a === 'admin' && b === 'pesanan') {
            if (!adminGuard()) return null;
            if (!c) return PagesOrders.renderPesananIndex(query);
            if (c === 'laporan') return PagesOrders.renderLaporan(query);
            if (c === 'buat') { location.replace('#/admin/pesanan'); return null; }
            const id = Number(c);
            if (!Number.isInteger(id) || id <= 0) return PagesOrders.renderNotFound();
            if (d === 'edit') return PagesOrders.renderPesananEdit({ id });
            if (d === 'invoice') return PagesOrders.renderInvoice({ id });
            if (d) return PagesOrders.renderNotFound();
            return PagesOrders.renderPesananShow({ id }, query);
        }

        /* --------------------------- layanan ------------------------------ */
        if (a === 'admin' && b === 'layanan') {
            if (!adminGuard()) return null;
            if (c) { location.replace('#/admin/layanan'); return null; }
            return PagesServices.renderLayanan(query);
        }

        /* ------------------------- pengaturan ----------------------------- */
        if (a === 'admin' && b === 'pengaturan') {
            if (!adminGuard()) return null;
            if (c) { location.replace('#/admin/pengaturan'); return null; }
            return PagesSettings.renderPengaturan();
        }

        /* --------------------------- 404 ---------------------------------- */
        return notFound();
    }

    function notFound() {
        const isAdmin = parseHash().segments[0] === 'admin';
        const back = isAdmin ? '#/admin' : '#/';
        const backLabel = isAdmin ? 'Kembali ke Dashboard' : 'Kembali ke Beranda';
        if (isAdmin && !Store.currentUser()) { location.replace('#/login'); return null; }
        return {
            title: 'Halaman Tidak Ditemukan - Bersihinkost',
            html: `
            <div class="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <div class="w-20 h-20 rounded-full bg-lavender-50 text-lavender-300 flex items-center justify-center text-3xl mb-4 border-2 border-dashed border-lavender-200">
                    <i class="fa-solid fa-ghost"></i>
                </div>
                <h1 class="text-2xl font-extrabold text-gray-800 mb-1">404 — Halaman Tidak Ditemukan</h1>
                <p class="text-sm font-bold text-gray-400 mb-6">Alamat yang Anda buka tidak tersedia di demo ini.</p>
                <a href="${back}" class="px-6 py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all">${backLabel}</a>
            </div>`,
        };
    }

    /** Render view aktif ke #app */
    function mount(view) {
        if (!view) return; // rute dibatalkan (guard / redirect)

        // bersihkan view sebelumnya
        if (current && typeof current.destroy === 'function') {
            try { current.destroy(); } catch (e) { console.warn('destroy()', e); }
        }
        if (typeof PagesDashboard !== 'undefined' && typeof PagesDashboard.destroyCharts === 'function') {
            try { PagesDashboard.destroyCharts(); } catch (e) { /* noop */ }
        }
        current = view;

        if (view.title) document.title = view.title;
        const html = typeof view.html === 'string'
            ? view.html
            : (typeof view.layout === 'function' ? view.layout() : '');
        appEl().innerHTML = html;

        const flash = pendingFlash;
        pendingFlash = null;

        if (typeof view.layout === 'function') AdminLayout.bindLayout(flash);
        else if (flash) UI.toast(flash);

        if (typeof view.init === 'function') {
            try { view.init(); } catch (e) { console.error('init()', e); }
        }

        window.scrollTo({ top: 0, behavior: 'auto' });
    }

    /** Render ulang rute yang sedang aktif (dipanggil modul halaman). */
    function render() {
        mount(resolve());
    }

    function onHashChange() {
        render();
    }

    function boot() {
        if (!location.hash || !location.hash.startsWith('#/')) {
            location.replace('#/');
            return;
        }
        render();
    }

    const App = {
        get query() { return parseHash().query; },
        render,
        /** set toast yang tampil setelah render berikutnya */
        flash(msg) { pendingFlash = msg; },
    };
    global.App = App;

    window.addEventListener('hashchange', onHashChange);
    document.addEventListener('DOMContentLoaded', boot);
    if (document.readyState !== 'loading') boot();
})(window);
