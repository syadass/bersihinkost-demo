/* =============================================================================
 * Bersihinkost DEMO — Kelola Pesanan (daftar, filter, aksi, jadwal manual,
 * laporan cetak) + halaman detail, edit, invoice.
 * ========================================================================== */
(function (global) {
    'use strict';

    const { esc, fmtRp } = { esc: UI.esc, fmtRp: Store.fmtRp };
    const PER_PAGE = 5;

    const TABS = [
        ['all', 'fa-layer-group', '', 'Semua'],
        ['menunggu-acc', 'fa-clock', 'text-amber-500', 'Menunggu ACC'],
        ['terjadwal', 'fa-calendar-check', 'text-lavender-500', 'Menunggu Eksekusi'],
        ['selesai', 'fa-circle-check', 'text-emerald-500', 'Selesai'],
        ['batal', 'fa-ban', 'text-red-500', 'Batal'],
    ];

    const SORTS = [
        ['terbaru', 'Terbaru'], ['terlama', 'Terlama'],
        ['id_asc', 'ID ↑'], ['id_desc', 'ID ↓'],
        ['nama_asc', 'Nama A–Z'], ['nama_desc', 'Nama Z–A'],
        ['usulan_asc', 'Usulan ↑'], ['usulan_desc', 'Usulan ↓'],
        ['fix_asc', 'Jadwal ↑'], ['fix_desc', 'Jadwal ↓'],
    ];

    function buildQuery(patch) {
        const p = new URLSearchParams();
        Object.entries(App.query).forEach(([k, v]) => { if (v !== '' && v != null) p.set(k, v); });
        Object.entries(patch).forEach(([k, v]) => {
            if (v === '' || v == null) p.delete(k); else p.set(k, v);
        });
        const s = p.toString();
        return '#/admin/pesanan' + (s ? '?' + s : '');
    }

    /* =========================== daftar pesanan =========================== */
    function renderPesananIndex(query) {
        const setting = Store.settings();
        const user = Store.currentUser();

        let tab = query.tab || 'all';
        if (!TABS.some(t => t[0] === tab)) tab = 'all';
        const sort = SORTS.some(s => s[0] === (query.sort || 'terbaru')) ? (query.sort || 'terbaru') : 'terbaru';
        const search = query.search || '';
        const bulan = query.bulan || 'all';
        const tahun = query.tahun || 'all';
        let page = Math.max(1, Number(query.page || 1));

        const { list, counts, years } = Store.queryOrders({ tab, search, sort, bulan, tahun });
        const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
        if (page > totalPages) page = totalPages;
        const rows = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
        const firstItem = list.length ? (page - 1) * PER_PAGE + 1 : 0;
        const lastItem = Math.min(page * PER_PAGE, list.length);
        const activeServices = Store.activeServices();

        const arrow = (asc, desc) => sort === asc
            ? '<i class="fa-solid fa-arrow-up text-[10px] ml-1"></i>'
            : sort === desc ? '<i class="fa-solid fa-arrow-down text-[10px] ml-1"></i>'
                : '<i class="fa-solid fa-sort text-[10px] ml-1 opacity-40"></i>';
        const sortLink = (asc, desc) => buildQuery({ sort: sort === asc ? desc : asc, page: '' });
        const itemsLabel = (o) => o.items.map(i => `${i.service_name} (${i.qty}x)`).join(', ');
        const effDate = (o) => o.tanggal_fix || o.tanggal_usulan;

        const mobileCards = rows.length ? rows.map(o => `
            <a href="#/admin/pesanan/${o.id}?from=index" class="block bg-white rounded-2xl shadow-card border border-lavender-50 p-4 active:scale-[0.99] transition-transform">
                <div class="flex items-start justify-between gap-2 mb-1.5">
                    <div class="min-w-0">
                        <p class="text-sm font-extrabold text-gray-800 truncate">#${o.id} • ${esc(o.customer_name)}</p>
                        <p class="text-[11px] font-semibold text-gray-400 truncate">${esc(o.alamat)}</p>
                    </div>
                    ${UI.miniBadge(o.status)}
                </div>
                <p class="text-[11px] font-semibold text-gray-500 truncate mb-2">${esc(itemsLabel(o))}</p>
                <div class="flex items-center justify-between pt-2 border-t border-dashed border-gray-100">
                    <span class="text-[11px] font-bold text-gray-400"><i class="fa-regular fa-clock mr-1"></i>${esc(Store.fmtDateTime(effDate(o)))}</span>
                    <span class="text-sm font-extrabold text-gray-800">Rp${Store.fmtNumber(o.total_harga)}</span>
                </div>
            </a>`).join('') : emptyState('Tidak ada pesanan ditemukan', 'Pesanan baru dari pemesan kost akan muncul di sini');

        const tableRows = rows.map(o => `
            <tr class="hover:bg-lavender-50/30 transition-colors">
                <td class="py-4 px-6"><span class="font-extrabold text-gray-800 block whitespace-nowrap">#${o.id}</span></td>
                <td class="py-4 px-6 max-w-[220px]">
                    <span class="font-extrabold text-gray-800 block">${esc(o.customer_name)}</span>
                    <span class="text-xs font-medium text-gray-400 block truncate" title="${esc(o.alamat)}">${esc(o.alamat)}</span>
                </td>
                <td class="py-4 px-6 font-medium text-gray-600 max-w-[220px]" title="${esc(itemsLabel(o))}">${esc(itemsLabel(o).length > 50 ? itemsLabel(o).slice(0, 50) + '…' : itemsLabel(o))}</td>
                <td class="py-4 px-6 whitespace-nowrap">
                    <span class="text-sm font-extrabold text-gray-800 block">${esc(Store.fmtDate(effDate(o)))}</span>
                    <span class="text-[11px] font-bold text-gray-400 block"><i class="fa-regular fa-clock mr-1"></i>${esc(Store.timeOf(effDate(o)))} WIB</span>
                </td>
                <td class="py-4 px-6 font-extrabold text-gray-800 whitespace-nowrap">Rp${Store.fmtNumber(o.total_harga)}</td>
                <td class="py-4 px-6 whitespace-nowrap">${UI.miniBadge(o.status)}</td>
                <td class="py-4 px-6">
                    <div class="flex items-center justify-center gap-1.5">
                        ${rowMainAction(o)}
                        <div>
                            <button data-menu="${o.id}" title="Aksi lain" class="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
                            </button>
                            <div id="rowMenu-${o.id}" class="hidden w-56 bg-white rounded-2xl shadow-float border border-lavender-100 p-2 z-50">
                                <a href="#/admin/pesanan/${o.id}?from=index" class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-lavender-50 hover:text-lavender-600">
                                    <i class="fa-solid fa-eye w-4 text-center"></i> Detail Pesanan
                                </a>
                                ${!['completed', 'cancelled'].includes(o.status) ? `
                                    <a href="#/admin/pesanan/${o.id}/edit" class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-lavender-50 hover:text-lavender-600">
                                        <i class="fa-solid fa-pen-to-square w-4 text-center"></i> Ubah Pesanan
                                    </a>
                                    <div class="mt-1 pt-2 border-t border-dashed border-gray-200">
                                        <input type="text" id="alasan-${o.id}" required placeholder="Alasan tolak..." class="w-full text-[11px] font-bold bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-red-300 mb-1.5">
                                        <button data-cancel="${o.id}" class="w-full py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 flex items-center justify-center gap-1.5">
                                            <i class="fa-solid fa-xmark"></i> Tolak Pesanan
                                        </button>
                                    </div>` : ''}
                                ${['cancelled', 'completed'].includes(o.status) ? `
                                    <div class="mt-1 pt-2 border-t border-dashed border-gray-200">
                                        <button data-del="${o.id}" class="w-full py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-1.5">
                                            <i class="fa-solid fa-trash-can"></i> Hapus Pesanan
                                        </button>
                                    </div>` : ''}
                            </div>
                        </div>
                    </div>
                </td>
            </tr>`).join('');

        const content = `
        <header class="flex flex-col gap-3 mb-5 sm:mb-6 pt-2">
            <div>
                <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Kelola Pesanan Masuk</h1>
                <p class="text-xs sm:text-sm font-bold text-lavender-500">Daftar booking pembersihan kamar kost dari pemesan</p>
            </div>
            <div class="flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-2 sm:gap-3">
                <form id="searchForm" class="relative flex-1 min-w-0">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400"><i class="fa-solid fa-magnifying-glass"></i></span>
                    <input type="text" name="search" value="${esc(search)}" placeholder="Cari nama atau alamat..." class="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-3xl bg-white border-none shadow-card text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
                </form>
                <div class="flex items-center gap-2 shrink-0">
                    <button id="manualBtn" class="flex-1 min-[480px]:flex-none px-4 py-3 rounded-3xl bg-peach-500 text-white font-extrabold text-xs shadow-md hover:bg-peach-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap" title="Buat jadwal manual">
                        <i class="fa-solid fa-plus text-[10px]"></i> Buat Manual
                    </button>
                    ${tab === 'selesai' ? `
                        <a href="${buildQuery({}).replace('#/admin/pesanan', '#/admin/pesanan/laporan')}" class="flex-1 min-[480px]:flex-none px-4 py-3 rounded-3xl bg-emerald-500 text-white font-extrabold text-xs shadow-md hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap" title="Cetak laporan pemasukan">
                            <i class="fa-solid fa-print text-[10px]"></i> Cetak
                        </a>` : ''}
                    ${UI.profileChip(user)}
                </div>
            </div>
        </header>

        <div class="flex flex-col gap-2 mb-4 sm:mb-5">
            <div class="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 flex-1 min-w-0">
                ${TABS.map(([key, icon, color, label]) => `
                    <a href="${buildQuery({ tab: key === 'all' ? '' : key, page: '' })}" class="${tab === key
                        ? 'px-5 py-2.5 rounded-full bg-lavender-600 text-white font-bold text-sm shadow-md flex items-center gap-2 whitespace-nowrap transition-transform hover:scale-105'
                        : 'px-5 py-2.5 rounded-full bg-white text-gray-600 font-bold text-sm shadow-card hover:bg-lavender-50 hover:text-lavender-600 transition-all flex items-center gap-2 whitespace-nowrap'}">
                        <i class="fa-solid ${icon} text-xs ${tab === key ? '' : color}"></i> ${label} (<span>${counts[key] ?? 0}</span>)
                    </a>`).join('')}
            </div>
            <form id="filterForm" class="shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                <select name="bulan" title="Filter bulan pengerjaan" class="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-white border-none shadow-card text-xs sm:text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer">
                    <option value="all" ${bulan === 'all' ? 'selected' : ''}>Semua bulan</option>
                    ${Store.MONTHS_ID.map((m, i) => `<option value="${i + 1}" ${String(bulan) === String(i + 1) ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
                <select name="tahun" title="Filter tahun pengerjaan" class="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-white border-none shadow-card text-xs sm:text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer">
                    <option value="all" ${tahun === 'all' ? 'selected' : ''}>Semua tahun</option>
                    ${years.map(y => `<option value="${y}" ${String(tahun) === String(y) ? 'selected' : ''}>${y}</option>`).join('')}
                </select>
                <select name="sort" title="Urutkan" class="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-white border-none shadow-card text-xs sm:text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer">
                    ${SORTS.map(([v, l]) => `<option value="${v}" ${sort === v ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
            </form>
        </div>

        <div class="flex-1 overflow-y-auto pb-6 sm:pr-2 min-h-0">
            <div class="grid gap-3 md:hidden">${mobileCards}</div>
            <div class="hidden md:block bg-white rounded-3xl shadow-card border border-lavender-50 overflow-hidden">
                <div class="table-scroll">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-gray-100 bg-lavender-50/50 text-gray-500 text-xs font-extrabold uppercase tracking-wider">
                                <th class="py-4 px-6"><a href="${sortLink('id_asc', 'id_desc')}" class="inline-flex items-center hover:text-lavender-600" title="Urutkan ID">ID ${arrow('id_asc', 'id_desc')}</a></th>
                                <th class="py-4 px-6"><a href="${sortLink('nama_asc', 'nama_desc')}" class="inline-flex items-center hover:text-lavender-600" title="Urutkan nama">Pemesan ${arrow('nama_asc', 'nama_desc')}</a></th>
                                <th class="py-4 px-6">Layanan</th>
                                <th class="py-4 px-6"><a href="${sortLink('fix_asc', 'fix_desc')}" class="inline-flex items-center hover:text-lavender-600" title="Urutkan tanggal pengerjaan (fix)">Jadwal ${arrow('fix_asc', 'fix_desc')}</a></th>
                                <th class="py-4 px-6">Tarif</th>
                                <th class="py-4 px-6">Status</th>
                                <th class="py-4 px-6 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 text-sm font-semibold text-gray-700">${tableRows}</tbody>
                    </table>
                </div>
                ${rows.length ? '' : emptyState('Tidak ada pesanan ditemukan', 'Pesanan baru dari pemesan kost akan muncul di sini')}
            </div>

            <div class="mt-4 flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-2 min-[480px]:justify-between">
                <p class="text-xs font-bold text-gray-400 text-center min-[480px]:text-left">
                    Menampilkan ${firstItem}–${lastItem} dari ${list.length} pesanan
                </p>
                <div class="flex items-center justify-center gap-2">
                    ${page > 1
                        ? `<a href="${buildQuery({ page: page - 1 })}" class="px-4 py-2 rounded-full bg-white text-lavender-600 font-extrabold text-xs shadow-card hover:bg-lavender-600 hover:text-white transition-all">‹ Prev</a>`
                        : `<span class="px-4 py-2 rounded-full bg-white text-gray-300 font-extrabold text-xs shadow-card cursor-not-allowed select-none">‹ Prev</span>`}
                    <span class="min-w-[2.5rem] text-center px-4 py-2 rounded-full bg-lavender-600 text-white font-extrabold text-xs shadow-md select-none">${page}</span>
                    ${page < totalPages
                        ? `<a href="${buildQuery({ page: page + 1 })}" class="px-4 py-2 rounded-full bg-white text-lavender-600 font-extrabold text-xs shadow-card hover:bg-lavender-600 hover:text-white transition-all">Next ›</a>`
                        : `<span class="px-4 py-2 rounded-full bg-white text-gray-300 font-extrabold text-xs shadow-card cursor-not-allowed select-none">Next ›</span>`}
                </div>
            </div>
        </div>

        <!-- Modal Buat Jadwal Manual -->
        <div id="manualModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div class="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-float w-full max-w-2xl border border-lavender-50 relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
                <div class="flex justify-between items-center gap-3 p-5 border-b border-gray-100 shrink-0">
                    <div>
                        <h3 class="text-lg font-extrabold text-gray-800">Buat Jadwal Manual</h3>
                        <p class="text-xs font-semibold text-gray-400">Order walk-in / telepon — langsung tercatat <span class="text-emerald-500 font-extrabold">Confirmed</span></p>
                    </div>
                    <button id="manualClose" class="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 shrink-0"><i class="fa-solid fa-xmark text-sm"></i></button>
                </div>
                <form id="manualForm" class="overflow-y-auto p-5 space-y-4">
                    <div class="grid sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama Pemesan <span class="text-peach-500">*</span></label>
                            <input type="text" name="customer_name" required class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400">
                        </div>
                        <div>
                            <label class="block text-xs font-extrabold text-gray-600 mb-1">Tanggal & Jam Pengerjaan (fix) <span class="text-peach-500">*</span></label>
                            <div class="grid grid-cols-2 gap-2">
                                <input type="date" name="tanggal_fix" value="${Store.todayStr()}" required class="min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400">
                                <input type="time" name="jam_fix" min="${esc(setting.jam_mulai)}" max="${esc(setting.jam_selesai)}" value="09:00" required class="min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400">
                            </div>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1">Alamat Kost / Kamar <span class="text-peach-500">*</span></label>
                        <textarea name="alamat" rows="2" required class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400"></textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-2">Item Layanan</label>
                        <div id="manualItemRows" class="space-y-2"></div>
                        <button type="button" id="manualAddRow" class="mt-2 px-4 py-2 rounded-full bg-peach-50 text-peach-600 text-xs font-extrabold hover:bg-peach-100 transition-colors">+ Tambah Item</button>
                    </div>
                    <div class="grid grid-cols-2 gap-2 pt-1">
                        <button type="button" id="manualCancel" class="py-3 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Batal</button>
                        <button class="py-3 rounded-2xl bg-peach-500 text-white font-extrabold text-sm shadow-md hover:bg-peach-600 transition-all">Simpan Jadwal</button>
                    </div>
                </form>
            </div>
        </div>`;

        return {
            title: 'Kelola Pesanan - Bersihinkost',
            layout: () => AdminLayout.adminLayout('pesanan', content),
            init() {
                // search
                document.getElementById('searchForm').onsubmit = (e) => {
                    e.preventDefault();
                    location.hash = buildQuery({ search: e.target.search.value.trim(), page: '' });
                };
                // filter (submit saat ganti)
                document.getElementById('filterForm').onchange = (e) => {
                    const f = e.target.form;
                    location.hash = buildQuery({
                        bulan: f.bulan.value, tahun: f.tahun.value, sort: f.sort.value, page: '',
                    });
                };

                // dropdown row menu (fixed position)
                const closeMenus = () => document.querySelectorAll('[id^="rowMenu-"]').forEach(m => m.classList.add('hidden'));
                document.querySelectorAll('[data-menu]').forEach(btn => {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        const menu = document.getElementById('rowMenu-' + btn.dataset.menu);
                        const wasHidden = menu.classList.contains('hidden');
                        closeMenus();
                        if (!wasHidden) return;
                        const r = btn.getBoundingClientRect();
                        menu.style.position = 'fixed';
                        menu.classList.remove('hidden');
                        const h = menu.offsetHeight;
                        let top = r.bottom + 4;
                        if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
                        menu.style.top = top + 'px';
                        menu.style.left = Math.max(8, r.right - 224) + 'px';
                        menu.onclick = ev => ev.stopPropagation();
                    };
                });
                document.addEventListener('click', closeMenus);
                document.addEventListener('scroll', closeMenus, true);

                // aksi utama per baris
                document.querySelectorAll('[data-acc]').forEach(btn => {
                    btn.onclick = () => {
                        const id = Number(btn.dataset.acc);
                        const o = Store.order(id);
                        const res = Store.accOrder(id, Store.dayOf(o.tanggal_fix || o.tanggal_usulan), Store.timeOf(o.tanggal_fix || o.tanggal_usulan));
                        if (!res.ok) return UI.toast(res.message, 'err');
                        UI.toast(res.message); App.render();
                    };
                });
                document.querySelectorAll('[data-complete]').forEach(btn => {
                    btn.onclick = () => {
                        const id = Number(btn.dataset.complete);
                        UI.confirm({
                            title: 'Tandai Selesai?', message: `Order #${id} akan ditandai selesai dan masuk kas.`,
                            confirmText: 'Ya, Selesaikan', tone: 'emerald', icon: 'fa-check-double',
                            onConfirm: () => { const r = Store.completeOrder(id); UI.toast(r.message); App.render(); },
                        });
                    };
                });
                document.querySelectorAll('[data-cancel]').forEach(btn => {
                    btn.onclick = () => {
                        const id = Number(btn.dataset.cancel);
                        const alasan = document.getElementById('alasan-' + id)?.value.trim();
                        if (!alasan) return UI.toast('Alasan tolak wajib diisi.', 'err');
                        UI.confirm({
                            title: 'Tolak Pesanan?', message: `Order #${id} akan ditolak/dibatalkan.`,
                            confirmText: 'Ya, Tolak', tone: 'red', icon: 'fa-ban',
                            onConfirm: () => { const r = Store.cancelOrder(id, alasan); UI.toast(r.message); App.render(); },
                        });
                    };
                });
                document.querySelectorAll('[data-del]').forEach(btn => {
                    btn.onclick = () => {
                        const id = Number(btn.dataset.del);
                        UI.confirm({
                            title: 'Hapus Pesanan?', message: `Riwayat pesanan #${id} akan dihapus permanen.`,
                            confirmText: 'Ya, Hapus', tone: 'red', icon: 'fa-trash-can',
                            onConfirm: () => { const r = Store.deleteOrder(id); UI.toast(r.message); App.render(); },
                        });
                    };
                });

                // modal manual
                const modal = document.getElementById('manualModal');
                const openModal = () => { modal.classList.remove('hidden'); modal.classList.add('flex'); };
                const closeModal = () => { modal.classList.add('hidden'); modal.classList.remove('flex'); };
                document.getElementById('manualBtn').onclick = openModal;
                document.getElementById('manualClose').onclick = closeModal;
                document.getElementById('manualCancel').onclick = closeModal;
                modal.onclick = e => { if (e.target === modal) closeModal(); };

                const addRow = (sid = '', qty = 1) => {
                    const div = document.createElement('div');
                    div.innerHTML = UI.itemRow(activeServices, sid || activeServices[0]?.id, qty,
                        'flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400');
                    const row = div.firstElementChild;
                    document.getElementById('manualItemRows').appendChild(row);
                };
                document.getElementById('manualAddRow').onclick = () => addRow();
                addRow();

                document.getElementById('manualForm').onsubmit = (e) => {
                    e.preventDefault();
                    const f = e.target;
                    const res = Store.createOrder({
                        customer_name: f.customer_name.value.trim(),
                        alamat: f.alamat.value.trim(),
                        tanggal_usulan: f.tanggal_fix.value,
                        jam_usulan: f.jam_fix.value,
                        tanggal_fix: f.tanggal_fix.value,
                        status: 'confirmed',
                        items: UI.readItemRows('manualItemRows'),
                    });
                    if (!res.ok) return UI.toast(res.message, 'err');
                    closeModal();
                    UI.toast(`Jadwal manual #${res.order.id} tersimpan sebagai Confirmed.`);
                    location.hash = `#/admin/pesanan/${res.order.id}`;
                };
            },
        };
    }

    function rowMainAction(o) {
        if (['pending', 'rescheduled'].includes(o.status)) {
            const tgl = Store.dayOf(o.tanggal_fix || o.tanggal_usulan);
            const jam = Store.timeOf(o.tanggal_fix || o.tanggal_usulan);
            return `<button data-acc="${o.id}" title="ACC (fix: ${esc(Store.fmtDateTime(o.tanggal_fix || o.tanggal_usulan))})" class="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm">
                <i class="fa-solid fa-check text-xs"></i></button>`;
        }
        if (o.status === 'confirmed') {
            return `<button data-complete="${o.id}" title="Tandai Selesai" class="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm">
                <i class="fa-solid fa-check-double text-xs"></i></button>`;
        }
        return `<a href="#/admin/pesanan/${o.id}?from=index" title="Detail" class="w-8 h-8 rounded-xl bg-lavender-600 text-white flex items-center justify-center hover:bg-lavender-700 transition-colors shadow-sm">
            <i class="fa-solid fa-eye text-xs"></i></a>`;
    }

    function emptyState(title, sub) {
        return `
        <div class="flex flex-col items-center justify-center text-center py-14 bg-white rounded-2xl shadow-card border border-lavender-50">
            <div class="w-16 h-16 rounded-full bg-lavender-50 text-lavender-300 flex items-center justify-center text-2xl mb-3 border-2 border-dashed border-lavender-200">
                <i class="fa-solid fa-inbox"></i>
            </div>
            <p class="text-sm font-extrabold text-gray-700">${esc(title)}</p>
            <p class="text-[11px] font-medium text-gray-400 mt-1">${esc(sub)}</p>
        </div>`;
    }

    /* =========================== halaman detail =========================== */
    function renderPesananShow(params, query) {
        const o = Store.order(params.id);
        const setting = Store.settings();
        if (!o) return renderNotFound();
        const backHref = query.from === 'dashboard' ? '#/admin' : '#/admin/pesanan';
        const services = Store.activeServices();

        const activeActions = !['cancelled', 'completed'].includes(o.status);
        const eff = o.tanggal_fix || o.tanggal_usulan;
        const durasi = (it) => {
            const svc = Store.service(it.service_id);
            return svc ? (svc.duration_minutes * it.qty) + ' Menit' : '-';
        };

        const content = `
        <div class="h-full overflow-y-auto pr-1 sm:pr-2 pb-6">
            <div class="max-w-4xl mx-auto">
                <header class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pt-2 gap-3">
                    <div class="flex items-center gap-3 sm:gap-4">
                        <a href="${backHref}" class="w-11 h-11 rounded-2xl bg-white text-lavender-600 shadow-card flex items-center justify-center hover:bg-lavender-50 transition-colors border border-lavender-100 shrink-0">
                            <i class="fa-solid fa-arrow-left text-sm"></i>
                        </a>
                        <div>
                            <div class="flex items-center gap-3 flex-wrap">
                                <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">#${o.id}</h1>
                                ${UI.statusBadge(o.status)}
                            </div>
                            <p class="text-sm font-bold text-lavender-500">Detail pesanan, alamat, jadwal booking, dan aksi pengerjaan</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 sm:gap-3">
                        <button id="printInvBtn" class="px-4 sm:px-5 py-3 rounded-2xl bg-white text-lavender-600 border border-lavender-200 font-extrabold text-xs shadow-card hover:bg-lavender-50 transition-all flex items-center gap-2">
                            <i class="fa-solid fa-print text-sm"></i> Print Invoice
                        </button>
                        <button id="pdfInvBtn" class="px-4 sm:px-5 py-3 rounded-2xl bg-peach-500 text-white font-extrabold text-xs shadow-md hover:bg-peach-600 transition-all flex items-center gap-2">
                            <i class="fa-solid fa-file-arrow-down text-sm"></i> Unduh PDF
                        </button>
                    </div>
                </header>

                <div class="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-card border border-lavender-50 p-5 sm:p-8 space-y-6">
                    <div>
                        <h3 class="text-base font-extrabold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                            <i class="fa-solid fa-user-tag text-lavender-500"></i> Informasi Pemesan & Alamat Tujuan
                        </h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <span class="text-xs font-bold text-gray-400 block mb-1">Nama Lengkap</span>
                                <span class="font-extrabold text-gray-800 text-base">${esc(o.customer_name)}</span>
                            </div>
                            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <span class="text-xs font-bold text-gray-400 block mb-1">Nomor Pesanan</span>
                                <span class="font-extrabold text-gray-800 text-base">#${o.id}</span>
                            </div>
                            <div class="sm:col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <span class="text-xs font-bold text-gray-400 block mb-1">Alamat / Detail Lokasi Kost</span>
                                <span class="font-extrabold text-peach-600 text-base block break-anywhere">${esc(o.alamat)}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-base font-extrabold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                            <i class="fa-solid fa-calendar-days text-lavender-500"></i> Jadwal & Waktu
                        </h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div class="bg-lavender-50/50 p-4 rounded-2xl border border-lavender-100">
                                <span class="text-xs font-bold text-lavender-600 block mb-1"><i class="fa-solid fa-clock mr-1"></i> Tanggal Order Masuk</span>
                                <span class="font-extrabold text-gray-800 text-base">${esc(Store.fmtDateTimeLong(o.created_at))} WIB</span>
                            </div>
                            <div class="bg-peach-50/50 p-4 rounded-2xl border border-peach-100">
                                <span class="text-xs font-bold text-peach-600 block mb-1"><i class="fa-solid fa-calendar-check mr-1"></i> Tanggal Booking Pengerjaan (${o.tanggal_fix ? 'Fix' : 'Usulan'})</span>
                                <span class="font-extrabold text-gray-800 text-base">${esc(Store.fmtDateTimeLong(eff))} WIB</span>
                            </div>
                        </div>
                        <div class="mt-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <span class="text-xs font-bold text-gray-400 block mb-1">Catatan Tambahan:</span>
                            ${o.catatan_admin
                                ? `<p class="text-xs font-semibold text-gray-700 italic">"${esc(o.catatan_admin)}"</p>`
                                : `<p class="text-xs font-semibold text-gray-400 italic">Tidak ada catatan tambahan.</p>`}
                        </div>
                        ${o.alasan_batal ? `
                            <div class="mt-3 bg-red-50 p-4 rounded-2xl border border-red-100">
                                <span class="text-xs font-extrabold text-red-500 block mb-1"><i class="fa-solid fa-ban mr-1"></i> Alasan Batal:</span>
                                <p class="text-xs font-semibold text-red-600">${esc(o.alasan_batal)}</p>
                            </div>` : ''}
                    </div>

                    <div>
                        <h3 class="text-base font-extrabold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                            <i class="fa-solid fa-basket-shopping text-lavender-500"></i> Rincian Layanan & Estimasi Durasi
                        </h3>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead>
                                    <tr class="text-gray-400 text-xs font-extrabold uppercase border-b border-gray-100">
                                        <th class="pb-3">Jenis Layanan</th>
                                        <th class="pb-3 text-center">Estimasi Durasi</th>
                                        <th class="pb-3 text-center">Jumlah</th>
                                        <th class="pb-3 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 font-semibold text-gray-700">
                                    ${o.items.map(it => `
                                        <tr>
                                            <td class="py-3 font-extrabold text-gray-800">${esc(it.service_name)}</td>
                                            <td class="py-3 text-center text-gray-500">${esc(durasi(it))}</td>
                                            <td class="py-3 text-center text-gray-800 font-extrabold">${it.qty}x</td>
                                            <td class="py-3 text-right font-extrabold text-peach-500">Rp${Store.fmtNumber(it.subtotal)}</td>
                                        </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <span class="text-xs font-bold text-gray-400 block">Total Estimasi Pengerjaan:</span>
                                <span class="text-sm font-extrabold text-lavender-600">${o.estimasi_menit} Menit</span>
                            </div>
                            <div class="sm:text-right">
                                <span class="text-xs font-bold text-gray-400 block">Total Biaya:</span>
                                <span class="text-2xl font-extrabold text-peach-500">Rp${Store.fmtNumber(o.total_harga)}</span>
                            </div>
                        </div>
                    </div>

                    ${activeActions ? `
                    <div class="pt-4 border-t-2 border-dashed border-lavender-100">
                        <h3 class="text-base font-extrabold text-gray-800 mb-1 flex items-center gap-2">
                            <i class="fa-solid fa-sliders text-lavender-500"></i> Kontrol Aksi Pengelola
                        </h3>
                        <p class="text-xs font-semibold text-gray-400 mb-4">Ubah status pengerjaan atau kelola pesanan ini secara mandiri:</p>
                        <div class="grid sm:grid-cols-2 gap-4">
                            <form id="accForm" class="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                                <label class="text-xs font-extrabold text-emerald-600">ACC — tanggal & jam fix pengerjaan</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <input type="date" name="tanggal_fix" value="${Store.dayOf(eff)}" class="min-w-0 px-3 py-2.5 rounded-xl bg-white border border-emerald-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                                    <input type="time" name="jam_fix" min="${esc(setting.jam_mulai)}" max="${esc(setting.jam_selesai)}" value="${Store.timeOf(eff)}" class="min-w-0 px-3 py-2.5 rounded-xl bg-white border border-emerald-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                                </div>
                                <p class="text-[11px] font-bold text-gray-400">Jam kerja ${esc(setting.jam_mulai)}–${esc(setting.jam_selesai)} WIB · tanggal libur ditolak</p>
                                <button class="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-extrabold hover:bg-emerald-600 transition-all"><i class="fa-solid fa-check mr-1"></i> ACC Pesanan</button>
                            </form>
                            <form id="reschedForm" class="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                                <label class="text-xs font-extrabold text-blue-600">Pindah tanggal & jam pengerjaan</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <input type="date" name="tanggal_fix" value="${Store.dayOf(eff)}" class="min-w-0 px-3 py-2.5 rounded-xl bg-white border border-blue-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
                                    <input type="time" name="jam_fix" min="${esc(setting.jam_mulai)}" max="${esc(setting.jam_selesai)}" value="${Store.timeOf(eff)}" class="min-w-0 px-3 py-2.5 rounded-xl bg-white border border-blue-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
                                </div>
                                <p class="text-[11px] font-bold text-gray-400">Jam kerja ${esc(setting.jam_mulai)}–${esc(setting.jam_selesai)} WIB · tanggal libur ditolak</p>
                                <button class="w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-extrabold hover:bg-blue-600 transition-all"><i class="fa-solid fa-calendar-days mr-1"></i> Simpan Tanggal Baru</button>
                            </form>
                            <form id="cancelForm" class="p-4 rounded-2xl bg-red-50/60 border border-red-100 space-y-2">
                                <label class="text-xs font-extrabold text-red-500">Batalkan + alasan (wajib)</label>
                                <input type="text" name="alasan_batal" required placeholder="cth: pemesan mundur, tanggal bentrok" class="w-full px-4 py-2.5 rounded-xl bg-white border border-red-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300">
                                <button class="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-extrabold hover:bg-red-600 transition-all"><i class="fa-solid fa-xmark mr-1"></i> Batalkan Pesanan</button>
                            </form>
                            <div class="p-4 rounded-2xl bg-lavender-50/60 border border-lavender-100 space-y-2">
                                <label class="text-xs font-extrabold text-lavender-600">Selesaikan / ubah data</label>
                                <a href="#/admin/pesanan/${o.id}/edit" class="block w-full py-2.5 rounded-xl bg-white border border-lavender-200 text-lavender-600 text-sm font-extrabold hover:bg-lavender-50 transition-all text-center"><i class="fa-solid fa-pen-to-square mr-1"></i> Ubah Pesanan</a>
                                <button id="selesaiBtn" class="w-full py-2.5 rounded-xl bg-lavender-600 text-white text-sm font-extrabold hover:bg-lavender-700 transition-all"><i class="fa-solid fa-check-double mr-1"></i> Tandai Selesai</button>
                            </div>
                        </div>
                    </div>` : `
                    <div class="pt-4 border-t-2 border-dashed border-lavender-100">
                        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div class="flex-1 ${o.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'} p-3.5 rounded-2xl text-center font-extrabold text-xs border flex items-center justify-center gap-2">
                                <i class="fa-solid ${o.status === 'completed' ? 'fa-circle-check' : 'fa-ban'} text-base"></i>
                                ${o.status === 'completed' ? 'Pengerjaan Telah Selesai' : 'Pesanan Telah Dibatalkan'}
                            </div>
                            ${o.status === 'cancelled' ? `
                                <button id="hapusBtn" class="py-3.5 px-6 rounded-2xl bg-red-50 text-red-500 font-extrabold text-xs hover:bg-red-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                                    <i class="fa-solid fa-trash-can"></i> Hapus
                                </button>` : ''}
                        </div>
                    </div>`}
                </div>
            </div>
        </div>

        <!-- Sumber invoice untuk cetak & PDF -->
        <div id="invoicePdf" class="hidden">${invoiceSheet(o, setting)}</div>
        <p id="dlStatus" class="hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] px-5 py-3 rounded-2xl bg-gray-800 text-white text-xs font-extrabold shadow-float">Menyiapkan PDF, mohon tunggu...</p>`;

        return {
            title: `Order #${o.id} - Bersihinkost`,
            layout: () => AdminLayout.adminLayout('pesanan', content),
            init() {
                const bind = (id, fn) => document.getElementById(id)?.addEventListener('submit', (e) => { e.preventDefault(); fn(e.target); });
                bind('accForm', (f) => UI.confirm({
                    title: 'ACC Pesanan?', message: `Pesanan #${o.id} akan di-ACC dengan tanggal fix yang dipilih.`,
                    confirmText: 'Ya, ACC', tone: 'emerald', icon: 'fa-check',
                    onConfirm: () => {
                        const r = Store.accOrder(o.id, f.tanggal_fix.value, f.jam_fix.value);
                        if (!r.ok) return UI.toast(r.message, 'err');
                        UI.toast(r.message); App.render();
                    },
                }));
                bind('reschedForm', (f) => UI.confirm({
                    title: 'Pindah Tanggal?', message: `Tanggal pengerjaan pesanan #${o.id} akan dipindah ke tanggal baru.`,
                    confirmText: 'Ya, Simpan', tone: 'blue', icon: 'fa-calendar-days',
                    onConfirm: () => {
                        const r = Store.rescheduleOrder(o.id, f.tanggal_fix.value, f.jam_fix.value);
                        if (!r.ok) return UI.toast(r.message, 'err');
                        UI.toast(r.message); App.render();
                    },
                }));
                bind('cancelForm', (f) => UI.confirm({
                    title: 'Batalkan Pesanan?', message: `Pesanan #${o.id} akan dibatalkan. Pastikan alasan sudah diisi dengan benar.`,
                    confirmText: 'Ya, Batalkan', tone: 'red', icon: 'fa-ban',
                    onConfirm: () => {
                        const r = Store.cancelOrder(o.id, f.alasan_batal.value);
                        if (!r.ok) return UI.toast(r.message, 'err');
                        UI.toast(r.message); App.render();
                    },
                }));
                document.getElementById('selesaiBtn')?.addEventListener('click', () => UI.confirm({
                    title: 'Tandai Selesai?', message: `Pesanan #${o.id} akan ditandai selesai dan masuk ke kas.`,
                    confirmText: 'Ya, Selesaikan', tone: 'lavender', icon: 'fa-check-double',
                    onConfirm: () => { const r = Store.completeOrder(o.id); UI.toast(r.message); App.render(); },
                }));
                document.getElementById('hapusBtn')?.addEventListener('click', () => UI.confirm({
                    title: 'Hapus Pesanan?', message: `Riwayat pesanan #${o.id} akan dihapus permanen dan tidak bisa dikembalikan.`,
                    confirmText: 'Ya, Hapus', tone: 'red', icon: 'fa-trash-can',
                    onConfirm: () => {
                        const r = Store.deleteOrder(o.id);
                        UI.toast(r.message);
                        location.hash = '#/admin/pesanan';
                    },
                }));

                document.getElementById('printInvBtn').onclick = () => UI.printHTML(invoiceSheet(o, setting));
                document.getElementById('pdfInvBtn').onclick = () => {
                    const status = document.getElementById('dlStatus');
                    status.classList.remove('hidden');
                    const host = document.getElementById('pdfHost') || (() => {
                        const d = document.createElement('div');
                        d.id = 'pdfHost';
                        d.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;';
                        document.body.appendChild(d);
                        return d;
                    })();
                    host.innerHTML = invoiceSheet(o, setting);
                    UI.pdfFrom(host, `invoice-${o.id}-bersihinkost.pdf`, status);
                };
            },
        };
    }

    /* ============================ halaman edit ============================ */
    function renderPesananEdit(params) {
        const o = Store.order(params.id);
        const setting = Store.settings();
        if (!o) return renderNotFound();
        if (['cancelled', 'completed'].includes(o.status)) {
            return {
                title: `Ubah Order #${o.id}`,
                layout: () => AdminLayout.adminLayout('pesanan', `
                    <div class="p-6 text-center bg-white rounded-3xl shadow-card border border-lavender-50 mt-6">
                        <p class="font-extrabold text-gray-700 mb-3">Pesanan yang sudah selesai/batal tidak bisa diubah.</p>
                        <a href="#/admin/pesanan/${o.id}" class="px-5 py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm">Kembali ke detail</a>
                    </div>`),
            };
        }
        const services = Store.activeServices();

        const content = `
        <div class="h-full overflow-y-auto pr-1 pt-2 pb-6 max-w-3xl">
            <a href="#/admin/pesanan/${o.id}" class="text-xs font-extrabold text-lavender-500">← Kembali ke detail</a>
            <h1 class="text-2xl font-extrabold text-gray-800 mt-1">Ubah Pesanan #${o.id}</h1>

            <form id="editForm" class="bg-white rounded-3xl shadow-card border border-lavender-50 p-6 mt-4 space-y-4">
                <div class="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama</label>
                        <input type="text" name="customer_name" value="${esc(o.customer_name)}" required class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1">Tanggal & Jam Usulan</label>
                        <div class="grid grid-cols-2 gap-2">
                            <input type="date" name="tanggal_usulan" value="${Store.dayOf(o.tanggal_usulan)}" required class="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
                            <input type="time" name="jam_usulan" min="${esc(setting.jam_mulai)}" max="${esc(setting.jam_selesai)}" value="${Store.timeOf(o.tanggal_usulan)}" required class="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
                        </div>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-extrabold text-gray-600 mb-1">Alamat</label>
                    <textarea name="alamat" rows="2" required class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">${esc(o.alamat)}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-extrabold text-gray-600 mb-1">Catatan Admin</label>
                    <input type="text" name="catatan_admin" value="${esc(o.catatan_admin || '')}" class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
                </div>
                <div>
                    <label class="block text-xs font-extrabold text-gray-600 mb-2">Item Layanan</label>
                    <div id="editItemRows" class="space-y-2"></div>
                    <button type="button" id="editAddRow" class="mt-2 px-4 py-2 rounded-full bg-lavender-50 text-lavender-600 text-xs font-extrabold hover:bg-lavender-100 transition-colors">+ Tambah Item</button>
                </div>
                <button class="w-full py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm">Simpan Perubahan</button>
            </form>
        </div>`;

        return {
            title: `Ubah Order #${o.id}`,
            layout: () => AdminLayout.adminLayout('pesanan', content),
            init() {
                const addRow = (sid, qty) => {
                    const div = document.createElement('div');
                    div.innerHTML = UI.itemRow(services, sid, qty);
                    document.getElementById('editItemRows').appendChild(div.firstElementChild);
                };
                o.items.forEach(it => addRow(it.service_id, it.qty));
                document.getElementById('editAddRow').onclick = () => addRow(services[0]?.id, 1);

                document.getElementById('editForm').onsubmit = (e) => {
                    e.preventDefault();
                    const f = e.target;
                    const res = Store.updateOrder(o.id, {
                        customer_name: f.customer_name.value.trim(),
                        alamat: f.alamat.value.trim(),
                        tanggal_usulan: f.tanggal_usulan.value,
                        jam_usulan: f.jam_usulan.value,
                        catatan_admin: f.catatan_admin.value.trim(),
                        items: UI.readItemRows('editItemRows'),
                    });
                    if (!res.ok) return UI.toast(res.message, 'err');
                    UI.toast(res.message);
                    location.hash = `#/admin/pesanan/${o.id}`;
                };
            },
        };
    }

    /* =========================== halaman invoice ========================== */
    function renderInvoice(params) {
        const o = Store.order(params.id);
        const setting = Store.settings();
        if (!o) return renderNotFound();
        return {
            title: `Invoice #${o.id} - Bersihinkost`,
            html: `
            <div class="min-h-screen py-6 px-4">
                <div id="invoicePdf" class="invoice-sheet max-w-3xl mx-auto bg-white rounded-3xl shadow-card border border-lavender-50 overflow-hidden">
                    ${invoiceSheet(o, setting)}
                    <div class="px-6 sm:px-10 pb-7">
                        <div class="no-print flex flex-col sm:flex-row gap-3 pt-2">
                            <button id="printBtn" class="flex-1 py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all flex items-center justify-center gap-2">
                                <i class="fa-solid fa-print"></i> Cetak
                            </button>
                            <button id="pdfBtn" class="flex-1 py-3.5 rounded-2xl bg-peach-500 text-white font-extrabold text-sm shadow-md hover:bg-peach-600 transition-all flex items-center justify-center gap-2">
                                <i class="fa-solid fa-file-arrow-down"></i> Unduh PDF
                            </button>
                            <button id="closeBtn" class="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Tutup</button>
                        </div>
                        <p id="dlStatus" class="no-print hidden text-center text-xs font-extrabold text-lavender-600">Menyiapkan PDF, mohon tunggu...</p>
                    </div>
                </div>
            </div>`,
            init() {
                document.getElementById('printBtn').onclick = () => UI.printHTML(invoiceSheet(o, setting));
                document.getElementById('pdfBtn').onclick = () => UI.pdfFrom(
                    document.getElementById('invoicePdf'), `invoice-${o.id}-bersihinkost.pdf`,
                    document.getElementById('dlStatus'));
                document.getElementById('closeBtn').onclick = () => { location.hash = `#/admin/pesanan/${o.id}`; };
            },
        };
    }

    /* ============================ halaman laporan ========================= */
    function renderLaporan(query) {
        const setting = Store.settings();
        const bulan = query.bulan || 'all';
        const tahun = query.tahun || 'all';
        const search = query.search || '';
        const rep = Store.laporan({ search, bulan, tahun });
        const itemsLabel = (o) => o.items.map(i => `${i.service_name} (${i.qty}x)`).join(', ');
        const printedAt = Store.fmtDate(Store.nowStamp());

        const sheet = `
        <div id="laporanPdf">
            <div class="text-gray-900 px-6 sm:px-10 py-8 print:p-0">
                <div class="flex flex-col min-[480px]:flex-row justify-between min-[480px]:items-start gap-4">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-lavender-700 shrink-0">
                            <i class="fa-solid fa-broom text-xl"></i>
                        </div>
                        <div>
                            <p class="text-xl font-black text-gray-900">${esc(setting.business_name)}</p>
                            <p class="text-xs font-semibold text-gray-500">Laporan Rekapitulasi Pemasukan Jasa Kebersihan Kost</p>
                        </div>
                    </div>
                    <div class="text-left min-[480px]:text-right shrink-0">
                        <p class="text-sm font-extrabold text-gray-900">Periode: ${esc(rep.periodeLabel)}</p>
                        <p class="text-xs font-semibold text-gray-500">Dicetak pada: ${esc(printedAt)}</p>
                    </div>
                </div>
                <div class="mt-4 border-b border-gray-200"></div>

                <div class="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-6 mb-8">
                    <div class="rounded-2xl p-5" style="flex:1;background:#f3f4f6;border-radius:1rem;padding:1.25rem;">
                        <p class="text-[11px] font-bold text-gray-500">TOTAL PEMASUKAN</p>
                        <p class="text-lg font-black mt-1">Rp ${Store.fmtNumber(rep.totalPeriode)}</p>
                    </div>
                    <div class="rounded-2xl p-5" style="flex:1;background:#f3f4f6;border-radius:1rem;padding:1.25rem;">
                        <p class="text-[11px] font-bold text-gray-500">KAMAR SELESAI</p>
                        <p class="text-lg font-black mt-1">${rep.rows.length} Kamar</p>
                    </div>
                    <div class="rounded-2xl p-5" style="flex:1;background:#f3f4f6;border-radius:1rem;padding:1.25rem;">
                        <p class="text-[11px] font-bold text-gray-500">RATA-RATA PER HARI</p>
                        <p class="text-lg font-black mt-1">Rp ${Store.fmtNumber(rep.rataHarian)}</p>
                        <p class="text-[11px] font-semibold text-gray-400">÷ ${rep.days} hari</p>
                    </div>
                </div>

                <p class="text-sm font-black tracking-wide mb-2">RINCIAN TRANSAKSI MASUK</p>
                <div class="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                <table class="w-full text-sm border-collapse min-w-[560px]">
                    <thead>
                        <tr class="text-gray-500 text-xs font-bold border-b border-gray-200">
                            <th class="px-4 py-3 text-left">ID & TANGGAL</th>
                            <th class="px-4 py-3 text-left">PEMESAN & ALAMAT</th>
                            <th class="px-4 py-3 text-left">LAYANAN</th>
                            <th class="px-4 py-3 text-right">NOMINAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rep.rows.length ? rep.rows.map(o => `
                            <tr class="border-b border-gray-100">
                                <td class="px-4 py-4 align-top">
                                    <span class="font-extrabold block whitespace-nowrap">ORD-${String(o.id).padStart(3, '0')}</span>
                                    <span class="text-xs text-gray-400">${esc(Store.fmtDate(o.updated_at))}</span>
                                </td>
                                <td class="px-4 py-4 align-top">
                                    <span class="font-extrabold block">${esc(o.customer_name)}</span>
                                    <span class="text-xs text-gray-500 block">${esc(o.alamat)}</span>
                                </td>
                                <td class="px-4 py-4 align-top text-gray-600 text-[13px]">${esc(itemsLabel(o))}</td>
                                <td class="px-4 py-4 text-right align-top font-extrabold whitespace-nowrap">Rp ${Store.fmtNumber(o.total_harga)}</td>
                            </tr>`).join('') : `
                            <tr><td colspan="4" class="py-8 text-center font-bold text-gray-400">Belum ada pemasukan pada periode ini.</td></tr>`}
                    </tbody>
                </table>
                </div>

                <div class="flex justify-end mt-12 text-sm">
                    <div class="text-center">
                        <p class="text-gray-500">Pengelola ${esc(setting.business_name)},</p>
                        <div class="h-20"></div>
                        <p class="font-extrabold border-t border-gray-800 pt-1 px-6">${esc(setting.operator_name)}</p>
                        <p class="text-xs text-gray-400">Solo Operator</p>
                    </div>
                </div>
            </div>
        </div>`;

        return {
            title: `Laporan Pemasukan ${rep.periodeLabel} - Bersihinkost`,
            html: `
            <div class="min-h-screen py-6 px-4">
                <div class="laporan-sheet max-w-4xl mx-auto bg-white rounded-3xl shadow-card border border-lavender-50 overflow-hidden">
                    ${sheet}
                    <div class="no-print px-6 sm:px-10 pb-7 flex flex-col sm:flex-row gap-3">
                        <button id="printBtn" class="flex-1 py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all flex items-center justify-center gap-2">
                            <i class="fa-solid fa-print"></i> Cetak
                        </button>
                        <button id="backBtn" class="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Kembali</button>
                    </div>
                </div>
            </div>`,
            init() {
                document.getElementById('printBtn').onclick = () =>
                    UI.printHTML(document.getElementById('laporanPdf').innerHTML);
                document.getElementById('backBtn').onclick = () => {
                    const p = new URLSearchParams();
                    if (search) p.set('search', search);
                    if (bulan !== 'all') p.set('bulan', bulan);
                    if (tahun !== 'all') p.set('tahun', tahun);
                    p.set('tab', 'selesai');
                    location.hash = '#/admin/pesanan?' + p.toString();
                };
            },
        };
    }

    /* ============================ lembar invoice ========================== */
    function invoiceSheet(o, setting) {
        const itemsLabel = o.items.map(i => `${i.service_name} (${i.qty}x)`).join(', ');
        void itemsLabel;
        return `
        <div class="bg-white overflow-hidden">
            <div class="text-white px-6 sm:px-10 py-7 flex flex-wrap justify-between items-center gap-4" style="background-color:#7c3aed;">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                        <i class="fa-solid fa-broom text-xl"></i>
                    </div>
                    <div>
                        <p class="text-xl font-black tracking-tight">${esc(setting.business_name)}</p>
                        <p class="text-xs font-semibold text-white/80">Jasa Pembersihan Kamar Kost · ${esc(setting.operator_name)}</p>
                    </div>
                </div>
                <div class="text-left sm:text-right">
                    <p class="text-xs font-bold text-white/70 uppercase tracking-wider">Invoice</p>
                    <p class="text-2xl font-black">#${o.id}</p>
                    <p class="text-xs font-semibold text-white/80">${esc(Store.fmtDate(o.created_at))}</p>
                </div>
            </div>

            <div class="px-6 sm:px-10 py-7 space-y-6">
                <div class="grid sm:grid-cols-2 gap-4 text-sm">
                    <div class="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                        <p class="text-xs font-bold text-gray-400 mb-1">Ditagihkan Kepada</p>
                        <p class="font-extrabold text-gray-800">${esc(o.customer_name)}</p>
                        <p class="font-semibold text-gray-500 text-xs mt-1 break-anywhere">${esc(o.alamat)}</p>
                    </div>
                    <div class="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-1">
                        <p class="text-xs font-bold text-gray-400">Status: <span class="text-gray-800 font-extrabold">${esc(Store.STATUS_INVOICE[o.status].label)}</span></p>
                        <p class="text-xs font-bold text-gray-400">Order masuk: <span class="text-gray-800">${esc(Store.fmtDateTime(o.created_at))}</span></p>
                        <p class="text-xs font-bold text-gray-400">Pengerjaan (${o.tanggal_fix ? 'fix' : 'usulan'}): <span class="text-gray-800">${esc(Store.fmtDateTime(o.tanggal_fix || o.tanggal_usulan))} WIB</span></p>
                    </div>
                </div>

                <table class="w-full text-left text-sm">
                    <thead>
                        <tr class="text-gray-400 text-xs font-extrabold uppercase border-b-2 border-gray-100">
                            <th class="pb-3">Layanan</th>
                            <th class="pb-3 text-center">Qty</th>
                            <th class="pb-3 text-right">Harga Satuan</th>
                            <th class="pb-3 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 font-semibold text-gray-700">
                        ${o.items.map(it => `
                            <tr>
                                <td class="py-3 font-extrabold text-gray-800">${esc(it.service_name)}</td>
                                <td class="py-3 text-center">${it.qty}x</td>
                                <td class="py-3 text-right">Rp${Store.fmtNumber(it.harga_satuan)}</td>
                                <td class="py-3 text-right font-extrabold">Rp${Store.fmtNumber(it.subtotal)}</td>
                            </tr>`).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="border-t-2 border-gray-200">
                            <td colspan="3" class="pt-4 text-right text-xs font-bold text-gray-400 uppercase">Total (${o.estimasi_menit} menit)</td>
                            <td class="pt-4 text-right text-2xl font-black text-lavender-600">Rp${Store.fmtNumber(o.total_harga)}</td>
                        </tr>
                    </tfoot>
                </table>

                ${o.catatan_admin ? `<p class="text-xs font-semibold text-gray-500 italic">Catatan: "${esc(o.catatan_admin)}"</p>` : ''}
                <p class="text-center text-xs font-semibold text-gray-400 pt-2">Terima kasih telah menggunakan layanan ${esc(setting.business_name)}.</p>
            </div>
        </div>`;
    }

    function renderNotFound() {
        return {
            title: 'Tidak Ditemukan',
            layout: () => AdminLayout.adminLayout('pesanan', `
                <div class="p-6 text-center bg-white rounded-3xl shadow-card border border-lavender-50 mt-6">
                    <p class="font-extrabold text-gray-700 mb-3">Data tidak ditemukan (mungkin sudah dihapus).</p>
                    <a href="#/admin/pesanan" class="px-5 py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm">Kembali ke daftar</a>
                </div>`),
        };
    }

    global.PagesOrders = {
        renderPesananIndex, renderPesananShow, renderPesananEdit,
        renderInvoice, renderLaporan, renderNotFound,
    };
})(window);
