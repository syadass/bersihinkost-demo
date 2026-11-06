/* =============================================================================
 * Bersihinkost DEMO — util UI (toast, modal konfirmasi, cetak/PDF, komponen)
 * ========================================================================== */
(function (global) {
    'use strict';

    const esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    let confirmCallback = null;
    const toneMap = {
        lavender: { box: 'bg-lavender-50 text-lavender-600', btn: 'bg-lavender-600 hover:bg-lavender-700', icon: 'fa-circle-question' },
        red: { box: 'bg-red-50 text-red-500', btn: 'bg-red-500 hover:bg-red-600', icon: 'fa-triangle-exclamation' },
        emerald: { box: 'bg-emerald-50 text-emerald-600', btn: 'bg-emerald-500 hover:bg-emerald-600', icon: 'fa-circle-check' },
        blue: { box: 'bg-blue-50 text-blue-600', btn: 'bg-blue-500 hover:bg-blue-600', icon: 'fa-calendar-days' },
        peach: { box: 'bg-peach-50 text-peach-600', btn: 'bg-peach-500 hover:bg-peach-600', icon: 'fa-file-arrow-down' },
    };

    const UI = {
        esc,

        toast(message, tone = 'ok') {
            const wrap = document.getElementById('toastWrap');
            if (!wrap) return;
            const t = tone === 'err'
                ? 'bg-red-50 border-red-200 text-red-600'
                : tone === 'warn'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700';
            const icon = tone === 'err' ? 'fa-circle-exclamation'
                : tone === 'warn' ? 'fa-triangle-exclamation' : 'fa-circle-check';
            const el = document.createElement('div');
            el.className = `pointer-events-auto bg-white border ${t} px-4 py-3 rounded-2xl shadow-float text-xs font-extrabold flex items-center gap-2 transition-all`;
            el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${esc(message)}</span>`;
            wrap.appendChild(el);
            setTimeout(() => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(-8px)';
                el.style.transition = 'all .25s';
                setTimeout(() => el.remove(), 260);
            }, 3200);
        },

        openConfirm({ title = 'Yakin?', message = 'Tindakan ini tidak dapat dibatalkan.', confirmText = 'Ya', tone = 'lavender', icon = null, onConfirm = null }) {
            const modal = document.getElementById('confirmModal');
            document.getElementById('confirmTitle').innerText = title;
            document.getElementById('confirmMessage').innerText = message;
            const yesBtn = document.getElementById('confirmYesBtn');
            yesBtn.innerText = confirmText;
            const t = toneMap[tone] || toneMap.lavender;
            document.getElementById('confirmIconWrap').className = 'w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-xl mb-3 ' + t.box;
            document.getElementById('confirmIcon').className = 'fa-solid ' + (icon || t.icon);
            yesBtn.className = 'py-3 rounded-2xl text-white font-extrabold text-sm shadow-md transition-all ' + t.btn;
            confirmCallback = onConfirm;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        },
        closeConfirm() {
            const modal = document.getElementById('confirmModal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            confirmCallback = null;
        },
        submitConfirm() {
            const cb = confirmCallback;
            UI.closeConfirm();
            if (typeof cb === 'function') cb();
        },
        confirm(opts, then) {
            const o = Object.assign({}, opts);
            if (typeof then === 'function') o.onConfirm = then;
            UI.openConfirm(o);
        },

        /* --------------------------- cetak & PDF --------------------------- */
        printHTML(innerHtml) {
            const root = document.getElementById('printRoot');
            root.innerHTML = innerHtml;
            document.body.classList.add('printing');
            window.print();
        },
        afterPrint() {
            document.body.classList.remove('printing');
            const root = document.getElementById('printRoot');
            if (root) root.innerHTML = '';
        },
        pdfFrom(element, filename, statusEl) {
            if (typeof html2pdf === 'undefined') {
                UI.toast('Library PDF tidak termuat (butuh koneksi internet). Gunakan Print → Save as PDF.', 'warn');
                return;
            }
            if (statusEl) statusEl.classList.remove('hidden');
            const opt = {
                margin: 10,
                filename,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            };
            html2pdf().set(opt).from(element).save()
                .then(() => { if (statusEl) statusEl.classList.add('hidden'); })
                .catch(() => {
                    if (statusEl) {
                        statusEl.innerText = 'Gagal membuat PDF otomatis. Gunakan tombol Print lalu pilih "Save as PDF".';
                        setTimeout(() => statusEl.classList.add('hidden'), 4000);
                    }
                });
        },

        /* ---------------------------- komponen ----------------------------- */
        statusBadge(status) {
            const s = Store.STATUS[status] || { label: status, badge: 'bg-gray-100 text-gray-500 border-gray-200' };
            return `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${s.badge}">${esc(s.label)}</span>`;
        },
        miniBadge(status) {
            const s = Store.STATUS[status] || { label: status, chip: 'bg-gray-100 text-gray-500' };
            return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap shrink-0 ${s.chip}">${esc(s.label)}</span>`;
        },
        initials(name) {
            const parts = String(name || '').trim().split(/\s+/);
            return (parts[0]?.[0] || '?').toUpperCase() + (parts[1]?.[0] || '').toUpperCase();
        },
        profileChip(user) {
            return `
            <div class="hidden min-[480px]:flex items-center gap-3 bg-white pl-3 pr-5 py-2 rounded-full shadow-card border border-lavender-100 shrink-0">
                <div class="w-10 h-10 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center font-extrabold border-2 border-white shadow-sm">${esc(UI.initials(user.name))}</div>
                <div class="hidden lg:block">
                    <p class="text-sm font-extrabold text-gray-800 leading-tight">${esc(user.name)}</p>
                    <p class="text-[10px] font-extrabold text-peach-500 uppercase tracking-wider">Solo Operator</p>
                </div>
            </div>`;
        },

        /** Form helper: baca nilai field */
        val(id) {
            const el = document.getElementById(id);
            return el ? String(el.value || '').trim() : '';
        },
        setVal(id, v) {
            const el = document.getElementById(id);
            if (el) el.value = v == null ? '' : v;
        },

        /** Baris item layanan (select layanan + qty) untuk form admin */
        itemRow(services, selectedId, qty, inputClass) {
            const cls = inputClass || 'flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400';
            const opts = services.map(s =>
                `<option value="${s.id}" ${Number(s.id) === Number(selectedId) ? 'selected' : ''}>${esc(s.name)} - Rp${Store.fmtNumber(s.price)}</option>`
            ).join('');
            return `
            <div class="item-row flex flex-col min-[420px]:flex-row gap-2">
                <select name="service_id" required class="${cls}">${opts}</select>
                <div class="flex gap-2">
                    <input type="number" name="qty" value="${qty || 1}" min="1" max="20" required class="${cls.replace('flex-1 min-w-0', 'flex-1 min-[420px]:w-20 min-[420px]:flex-none')}">
                    <button type="button" onclick="this.closest('.item-row').remove()" class="px-4 min-[420px]:px-3 rounded-xl bg-red-50 text-red-500 font-bold hover:bg-red-100" title="Hapus item">×</button>
                </div>
            </div>`;
        },

        readItemRows(containerId) {
            const rows = [];
            document.querySelectorAll(`#${containerId} .item-row`).forEach(r => {
                const sid = r.querySelector('[name=service_id]')?.value;
                const qty = Number(r.querySelector('[name=qty]')?.value || 0);
                if (sid) rows.push({ service_id: Number(sid), qty });
            });
            return rows;
        },
    };

    // Auto: form dengan data-confirm memakai modal global
    document.addEventListener('submit', function (e) {
        const form = e.target;
        if (!form || !form.hasAttribute || !form.hasAttribute('data-confirm')) return;
        if (form.dataset.confirmed === '1') { delete form.dataset.confirmed; return; }
        e.preventDefault();
        UI.openConfirm({
            title: form.getAttribute('data-confirm-title') || 'Yakin?',
            message: form.getAttribute('data-confirm'),
            confirmText: form.getAttribute('data-confirm-ok') || 'Ya, Lanjutkan',
            tone: form.getAttribute('data-confirm-tone') || 'lavender',
            icon: form.getAttribute('data-confirm-icon') || null,
            onConfirm: () => { form.dataset.confirmed = '1'; form.requestSubmit ? form.requestSubmit() : form.submit(); },
        });
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') UI.closeConfirm(); });
    document.getElementById('confirmModal')?.addEventListener('click', e => {
        if (e.target.id === 'confirmModal') UI.closeConfirm();
    });
    window.addEventListener('afterprint', () => UI.afterPrint());

    global.UI = UI;
})(window);
