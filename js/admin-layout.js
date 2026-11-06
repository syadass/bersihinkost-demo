/* =============================================================================
 * Bersihinkost DEMO — Layout dashboard admin (sidebar + shell)
 * ========================================================================== */
(function (global) {
    'use strict';

    const { esc } = UI;

    /**
     * Bungkus halaman admin.
     * @param {string} active  'dashboard' | 'pesanan' | 'layanan' | 'pengaturan'
     * @param {string} content HTML isi <main>
     * @param {string} [right] HTML panel kanan (opsional)
     */
    function adminLayout(active, content, right) {
        const user = Store.currentUser();
        const navItem = (key, href, icon, title) => {
            const on = active === key;
            return `<a href="${href}" title="${title}" class="${on
                ? 'w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 bg-white rounded-2xl lg:rounded-3xl flex items-center justify-center text-lavender-600 shadow-lg transform transition-transform hover:scale-105'
                : 'w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 text-lavender-200 hover:bg-white/10 rounded-2xl lg:rounded-3xl flex items-center justify-center transition-colors'}">
                <i class="fa-solid ${icon} text-xl"></i>
            </a>`;
        };

        return `
        <div class="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row overflow-x-hidden lg:overflow-hidden p-3 sm:p-5 gap-3 sm:gap-5">
            <!-- Floating Pill Sidebar -->
            <aside class="w-full lg:w-24 bg-gradient-to-r lg:bg-gradient-to-b from-lavender-600 to-lavender-800 rounded-2xl sm:rounded-3xl lg:rounded-[3rem] flex flex-row lg:flex-col items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 lg:py-8 lg:px-0 shadow-float z-40 text-white shrink-0 sticky top-3 sm:top-5 lg:static">
                <a href="#/admin" class="w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 shrink-0 bg-white/20 rounded-full flex items-center justify-center lg:mb-8 backdrop-blur-md border border-white/30 shadow-inner">
                    <i class="fa-solid fa-broom text-lg sm:text-xl lg:text-2xl text-white"></i>
                </a>
                <nav class="flex flex-row lg:flex-col gap-1.5 sm:gap-2 lg:gap-6 w-auto lg:w-full items-center flex-1 justify-center lg:justify-start overflow-x-auto scrollbar-hide px-1">
                    ${navItem('dashboard', '#/admin', 'fa-chart-pie', 'Dashboard Utama')}
                    ${navItem('pesanan', '#/admin/pesanan', 'fa-calendar-check', 'Kelola Pesanan')}
                    ${navItem('layanan', '#/admin/layanan', 'fa-list-check', 'Kelola Layanan & Harga')}
                </nav>
                <div class="flex flex-row lg:flex-col gap-1.5 sm:gap-2 lg:gap-4 mt-0 lg:mt-auto shrink-0">
                    <button id="logoutBtn" title="Keluar dari Dashboard" class="w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 text-lavender-200 hover:bg-white/10 rounded-2xl lg:rounded-3xl flex items-center justify-center transition-colors">
                        <i class="fa-solid fa-right-from-bracket text-xl"></i>
                    </button>
                    ${navItem('pengaturan', '#/admin/pengaturan', 'fa-gear', 'Pengaturan')}
                </div>
            </aside>

            <main class="flex-1 flex flex-col min-w-0 w-full bg-transparent overflow-visible pb-6 lg:pb-0">
                <div id="flashSlot"></div>
                ${content}
            </main>

            ${right || ''}
        </div>`;
    }

    /** Setelah layout terpasang: pasang handler logout + toast flash. */
    function bindLayout(flash) {
        const btn = document.getElementById('logoutBtn');
        if (btn) {
            btn.onclick = () => UI.confirm({
                title: 'Keluar dari Dashboard?',
                message: 'Sesi login akan diakhiri. Anda harus login ulang untuk mengelola pesanan.',
                confirmText: 'Ya, Keluar',
                tone: 'red',
                icon: 'fa-right-from-bracket',
                onConfirm: () => {
                    Store.logout();
                    location.hash = '#/login';
                },
            });
        }
        if (flash) UI.toast(flash);
    }

    global.AdminLayout = { adminLayout, bindLayout };
})(window);
