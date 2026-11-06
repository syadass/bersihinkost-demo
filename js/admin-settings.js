/* =============================================================================
 * Bersihinkost DEMO — Pengaturan Sistem
 * Profil usaha, jam operasional, tanggal libur, ubah akun, reset data demo
 * Meniru resources/views/admin/pengaturan/index.blade.php + SettingController
 * ========================================================================== */
(function (global) {
    'use strict';

    const { esc } = UI;

    function escHandler(e) {
        if (e.key !== 'Escape') return;
        const m = document.getElementById('accountModal');
        if (m && !m.classList.contains('hidden')) closeAccountModal();
    }
    function openAccountModal() {
        const m = document.getElementById('accountModal');
        if (!m) return;
        m.classList.remove('hidden');
        m.classList.add('flex');
    }
    function closeAccountModal() {
        const m = document.getElementById('accountModal');
        if (!m) return;
        m.classList.add('hidden');
        m.classList.remove('flex');
    }

    function renderPengaturan() {
        const s = Store.settings();
        const user = Store.currentUser();
        const closures = Store.closures();

        const content = `
        <header class="max-w-4xl w-full mx-auto flex flex-col gap-3 mb-5 sm:mb-6 pt-2">
            <div>
                <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Pengaturan Sistem</h1>
                <p class="text-xs sm:text-sm font-bold text-lavender-500">Kelola profil usaha, kontak WhatsApp, dan jam operasional</p>
            </div>

            <div class="flex items-center gap-4">
                <div class="flex items-center gap-3 bg-white pl-3 pr-5 py-2 rounded-full shadow-card border border-lavender-100">
                    <div class="w-10 h-10 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center font-extrabold border-2 border-white shadow-sm">${esc(UI.initials(user.name))}</div>
                    <div>
                        <p class="text-sm font-extrabold text-gray-800 leading-tight">${esc(user.name)}</p>
                        <p class="text-[10px] font-extrabold text-peach-500 uppercase tracking-wider">Solo Operator</p>
                    </div>
                </div>
            </div>
        </header>

        <div class="flex-1 overflow-y-auto pb-6 sm:pr-2 min-h-0">
            <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

                <!-- Card 1: Profil Usaha & Kontak -->
                <form id="profilForm" class="bg-white p-4 sm:p-6 rounded-3xl shadow-card border border-lavender-50 flex flex-col justify-between min-w-0">
                    <div>
                        <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                            <div class="w-10 h-10 rounded-2xl bg-lavender-50 text-lavender-600 flex items-center justify-center font-bold">
                                <i class="fa-solid fa-store"></i>
                            </div>
                            <div>
                                <h3 class="text-base font-extrabold text-gray-800">Profil Usaha & Kontak</h3>
                                <p class="text-xs font-semibold text-gray-400">Informasi yang tampil di web publik</p>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama Usaha</label>
                                <input type="text" name="business_name" value="${esc(s.business_name)}" required maxlength="100" class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                            </div>
                            <div>
                                <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama Pengelola (Solo Operator)</label>
                                <input type="text" name="operator_name" value="${esc(s.operator_name)}" required maxlength="100" class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                            </div>
                            <div>
                                <label class="block text-xs font-extrabold text-gray-600 mb-1">Nomor WhatsApp (Penerima Pesanan)</label>
                                <input type="text" name="admin_wa_number" value="${esc(s.admin_wa_number)}" required maxlength="20" class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                                <p class="text-[11px] text-gray-400 font-bold mt-1">Format 628... Semua tombol "Pesan via WhatsApp" mengarah ke nomor ini.</p>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 pt-4 border-t border-gray-100">
                        <button class="w-full py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all">
                            Simpan Perubahan Profil
                        </button>
                    </div>
                </form>

                <!-- Card 2: Jam Operasional -->
                <form id="operasionalForm" class="bg-white p-4 sm:p-6 rounded-3xl shadow-card border border-lavender-50 flex flex-col justify-between min-w-0">
                    <div>
                        <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                            <div class="w-10 h-10 rounded-2xl bg-peach-50 text-peach-600 flex items-center justify-center font-bold">
                                <i class="fa-solid fa-clock"></i>
                            </div>
                            <div>
                                <h3 class="text-base font-extrabold text-gray-800">Jam Operasional</h3>
                                <p class="text-xs font-semibold text-gray-400">Atur ketersediaan layanan harian</p>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-extrabold text-gray-600 mb-1">Status Pengerjaan Harian</label>
                                <select id="statusSelect" name="statusSelect" class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                                    <option value="open" ${s.is_open ? 'selected' : ''}>Buka (Menerima Pesanan)</option>
                                    <option value="closed" ${!s.is_open ? 'selected' : ''}>Tutup (Sedang Libur / Istirahat)</option>
                                </select>
                                <input type="hidden" name="is_open" id="isOpenHidden" value="${s.is_open ? 1 : 0}">
                                <label class="flex items-center gap-2 text-xs font-extrabold text-gray-500 mt-2">
                                    <input type="checkbox" id="isOpenCheck" ${s.is_open ? 'checked' : ''} class="w-4 h-4 accent-purple-600"> Tampilkan badge "Buka Hari Ini" di halaman umum
                                </label>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="col-span-1">
                                    <label class="block text-xs font-extrabold text-gray-600 mb-1">Jam Mulai</label>
                                    <input type="time" name="jam_mulai" value="${esc(s.jam_mulai)}" required class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                                </div>
                                <div class="col-span-1">
                                    <label class="block text-xs font-extrabold text-gray-600 mb-1">Jam Selesai</label>
                                    <input type="time" name="jam_selesai" value="${esc(s.jam_selesai)}" required class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-extrabold text-gray-600 mb-1">Catatan Khusus untuk Pemesan</label>
                                <textarea name="catatan_publik" rows="2" maxlength="500" placeholder="Info tambahan di halaman pemesanan..." class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">${esc(s.catatan_publik || '')}</textarea>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 pt-4 border-t border-gray-100">
                        <button class="w-full py-3.5 rounded-2xl bg-peach-500 text-white font-extrabold text-sm shadow-md hover:bg-peach-600 transition-all">
                            Simpan Jam Operasional
                        </button>
                    </div>
                </form>

                <!-- Card 3: Tanggal Libur / Tutup -->
                <div class="md:col-span-2 bg-white p-4 sm:p-6 rounded-3xl shadow-card border border-lavender-50 min-w-0">
                    <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                        <div class="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center font-bold">
                            <i class="fa-solid fa-calendar-xmark"></i>
                        </div>
                        <div>
                            <h3 class="text-base font-extrabold text-gray-800">Tanggal Libur / Tutup</h3>
                            <p class="text-xs font-semibold text-gray-400">Pemesan tidak bisa memilih tanggal-tanggal ini</p>
                        </div>
                    </div>
                    <form id="liburForm" class="flex flex-col sm:flex-row gap-2 mb-4">
                        <input type="date" name="tanggal" required min="${Store.todayStr()}" class="w-full sm:w-auto px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300">
                        <input type="text" name="keterangan" maxlength="100" placeholder="Keterangan (opsional, cth: Libur Lebaran)" class="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300">
                        <button class="px-5 py-3 rounded-2xl bg-red-500 text-white font-extrabold text-sm shadow-md hover:bg-red-600 transition-all whitespace-nowrap">+ Tambah Libur</button>
                    </form>
                    <div class="flex flex-wrap gap-2">
                        ${closures.length ? closures.map(l => `
                        <span class="inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-red-50 border border-red-100 text-xs font-extrabold text-red-500">
                            ${esc(Store.fmtDateLong(l.tanggal))}${l.keterangan ? ' · ' + esc(l.keterangan) : ''}
                            <button data-delclosure="${l.id}" class="w-6 h-6 rounded-full bg-white text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors font-bold" title="Hapus tanggal libur">×</button>
                        </span>`).join('')
                        : `<p class="text-xs font-bold text-gray-400">Belum ada tanggal libur. Semua tanggal bisa dipesan.</p>`}
                    </div>
                </div>
            </div>

            <!-- Akun Login -->
            <div class="max-w-4xl mx-auto bg-white rounded-3xl shadow-card border border-lavender-50 p-6 mt-6 text-sm font-bold text-gray-600">
                <div class="flex items-center justify-between gap-3 mb-2">
                    <h3 class="font-extrabold text-gray-800">Akun Login</h3>
                    <button type="button" id="openAccountBtn" class="px-4 py-2 rounded-full bg-lavender-50 text-lavender-600 text-xs font-extrabold hover:bg-lavender-100 transition-colors flex items-center gap-1.5">
                        <i class="fa-solid fa-pen-to-square"></i> Ubah
                    </button>
                </div>
                <p>Email: <span class="font-extrabold">${esc(user.email)}</span></p>
                <button type="button" id="logoutPageBtn" class="mt-4 w-full py-3 rounded-2xl bg-red-50 text-red-500 font-extrabold text-sm hover:bg-red-100 transition-all"><i class="fa-solid fa-right-from-bracket mr-2"></i>Keluar dari Dashboard</button>
            </div>

            <!-- Data Demo -->
            <div class="max-w-4xl mx-auto bg-white rounded-3xl shadow-card border border-lavender-50 p-6 mt-6 text-sm font-bold text-gray-600">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="min-w-0">
                        <h3 class="font-extrabold text-gray-800 mb-1"><i class="fa-solid fa-flask mr-2 text-lavender-500"></i>Data Demo</h3>
                        <p class="text-xs font-semibold text-gray-400">Semua perubahan tersimpan di localStorage browser ini. Reset akan mengembalikan data contoh seperti semula.</p>
                    </div>
                    <button type="button" id="resetDemoBtn" class="shrink-0 px-5 py-3 rounded-2xl bg-lavender-50 text-lavender-600 font-extrabold text-xs hover:bg-lavender-100 transition-all whitespace-nowrap">
                        <i class="fa-solid fa-rotate-left mr-1.5"></i> Reset Data Demo
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Ubah Akun -->
        <div id="accountModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden items-center justify-center p-4">
            <div class="bg-white rounded-[2rem] shadow-float w-full max-w-md border border-lavender-50 relative max-h-[90vh] flex flex-col overflow-hidden">
                <div class="flex justify-between items-center gap-3 p-5 border-b border-gray-100 shrink-0">
                    <div>
                        <h3 class="text-lg font-extrabold text-gray-800">Ubah Akun Login</h3>
                        <p class="text-xs font-semibold text-gray-400">Nama, email, dan kata sandi — kosongkan sandi bila tidak diganti</p>
                    </div>
                    <button type="button" id="closeAccountBtn" class="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 shrink-0">
                        <i class="fa-solid fa-xmark text-sm"></i>
                    </button>
                </div>
                <form id="accountForm" class="overflow-y-auto p-5 space-y-4">
                    <div id="accountErrors" class="hidden bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl"></div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama Pengelola</label>
                        <input type="text" name="name" value="${esc(user.name)}" required maxlength="100" class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1">Email Login</label>
                        <input type="email" name="email" value="${esc(user.email)}" required maxlength="100" class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1">Ulangi Email Baru <span class="font-semibold text-gray-400">(wajib sama, anti typo)</span></label>
                        <input type="email" name="email_confirmation" value="${esc(user.email)}" required maxlength="100" class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-extrabold text-gray-600 mb-1">Kata Sandi Baru</label>
                            <div class="relative">
                                <input type="password" id="accPassword" name="password" minlength="8" placeholder="Min. 8 karakter" class="w-full pl-4 pr-11 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                                <button type="button" data-toggle="accPassword" title="Tampilkan sandi" class="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-lavender-600 transition-colors">
                                    <i class="fa-solid fa-eye text-xs"></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-extrabold text-gray-600 mb-1">Ulangi Sandi</label>
                            <div class="relative">
                                <input type="password" id="accPasswordConfirm" name="password_confirmation" minlength="8" placeholder="Ulangi sandi" class="w-full pl-4 pr-11 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                                <button type="button" data-toggle="accPasswordConfirm" title="Tampilkan sandi" class="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-lavender-600 transition-colors">
                                    <i class="fa-solid fa-eye text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 pt-1">
                        <button type="button" id="cancelAccountBtn" class="py-3 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Batal</button>
                        <button class="py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all">Simpan Akun</button>
                    </div>
                </form>
            </div>
        </div>`;

        return {
            title: 'Pengaturan Sistem - Bersihinkost',
            layout: () => AdminLayout.adminLayout('pengaturan', content),
            init() {
                const $ = (id) => document.getElementById(id);

                /* ---------------------- profil usaha ---------------------- */
                $('profilForm').onsubmit = (e) => {
                    e.preventDefault();
                    const f = e.target;
                    const business_name = f.business_name.value.trim();
                    const operator_name = f.operator_name.value.trim();
                    const wa = f.admin_wa_number.value.replace(/\D/g, '');
                    if (!business_name) return UI.toast('Nama usaha wajib diisi.', 'err');
                    if (business_name.length > 100) return UI.toast('Nama usaha maks 100 karakter.', 'err');
                    if (!operator_name) return UI.toast('Nama pengelola wajib diisi.', 'err');
                    if (!wa) return UI.toast('Nomor WhatsApp wajib diisi (hanya angka).', 'err');
                    if (wa.length < 9) return UI.toast('Nomor WhatsApp terlalu pendek.', 'err');
                    Store.updateSettings({ business_name, operator_name, admin_wa_number: wa });
                    UI.toast('Profil usaha disimpan.');
                    App.render();
                };

                /* -------------------- jam operasional -------------------- */
                const statusSelect = $('statusSelect');
                const isOpenCheck = $('isOpenCheck');
                const isOpenHidden = $('isOpenHidden');
                statusSelect.onchange = () => {
                    const open = statusSelect.value === 'open';
                    isOpenCheck.checked = open;
                    isOpenHidden.value = open ? 1 : 0;
                };
                isOpenCheck.onchange = () => {
                    statusSelect.value = isOpenCheck.checked ? 'open' : 'closed';
                    isOpenHidden.value = isOpenCheck.checked ? 1 : 0;
                };

                $('operasionalForm').onsubmit = (e) => {
                    e.preventDefault();
                    const f = e.target;
                    const jam_mulai = f.jam_mulai.value;
                    const jam_selesai = f.jam_selesai.value;
                    if (!jam_mulai || !jam_selesai) return UI.toast('Jam mulai & selesai wajib diisi.', 'err');
                    if (jam_selesai <= jam_mulai) return UI.toast('Jam selesai harus setelah jam mulai.', 'err');
                    Store.updateSettings({
                        is_open: isOpenHidden.value === '1',
                        jam_mulai, jam_selesai,
                        catatan_publik: f.catatan_publik.value.trim(),
                    });
                    UI.toast('Jam operasional disimpan.');
                    App.render();
                };

                /* ---------------------- tanggal libur --------------------- */
                $('liburForm').onsubmit = (e) => {
                    e.preventDefault();
                    const f = e.target;
                    const res = Store.addClosure(f.tanggal.value, f.keterangan.value);
                    if (!res.ok) return UI.toast(res.message, 'err');
                    UI.toast(res.message);
                    App.render();
                };
                document.querySelectorAll('[data-delclosure]').forEach(btn => {
                    btn.onclick = () => {
                        const id = Number(btn.dataset.delclosure);
                        const c = Store.closures().find(x => x.id === id);
                        if (!c) return;
                        UI.confirm({
                            title: 'Hapus Libur?',
                            message: `Tanggal libur ${Store.fmtDateLong(c.tanggal)} akan dihapus.`,
                            confirmText: 'Ya, Hapus', tone: 'red', icon: 'fa-trash-can',
                            onConfirm: () => {
                                const r = Store.deleteClosure(id);
                                UI.toast(r.message, r.ok ? 'ok' : 'err');
                                if (r.ok) App.render();
                            },
                        });
                    };
                });

                /* ------------------------ akun login ---------------------- */
                $('openAccountBtn').onclick = openAccountModal;
                $('closeAccountBtn').onclick = closeAccountModal;
                $('cancelAccountBtn').onclick = closeAccountModal;
                $('accountModal').onclick = (e) => { if (e.target.id === 'accountModal') closeAccountModal(); };

                document.querySelectorAll('[data-toggle]').forEach(btn => {
                    btn.onclick = () => {
                        const input = document.getElementById(btn.dataset.toggle);
                        const show = input.type === 'password';
                        input.type = show ? 'text' : 'password';
                        btn.innerHTML = `<i class="fa-solid ${show ? 'fa-eye-slash' : 'fa-eye'} text-xs"></i>`;
                        btn.title = show ? 'Sembunyikan sandi' : 'Tampilkan sandi';
                    };
                });

                $('accountForm').onsubmit = (e) => {
                    e.preventDefault();
                    const f = e.target;
                    const box = $('accountErrors');
                    box.classList.add('hidden');
                    const name = f.name.value.trim();
                    const email = f.email.value.trim();
                    const email2 = f.email_confirmation.value.trim();
                    const pw = f.password.value;
                    const pw2 = f.password_confirmation.value;

                    const fail = (m) => {
                        box.textContent = m;
                        box.classList.remove('hidden');
                        f.scrollTop = 0;
                    };
                    if (email !== email2) return fail('Ulangi email baru tidak sama.');
                    if (pw || pw2) {
                        if (pw.length < 8) return fail('Kata sandi minimal 8 karakter.');
                        if (pw !== pw2) return fail('Ulangi kata sandi tidak sama.');
                    }
                    const res = Store.updateAccount({ name, email, password: pw || null }, user.id);
                    if (!res.ok) return fail(res.message);
                    closeAccountModal();
                    UI.toast('Akun login berhasil diperbarui.');
                    App.render();
                };

                $('logoutPageBtn').onclick = () => UI.confirm({
                    title: 'Keluar dari Dashboard?',
                    message: 'Sesi login akan diakhiri. Anda harus login ulang untuk mengelola pesanan.',
                    confirmText: 'Ya, Keluar', tone: 'red', icon: 'fa-right-from-bracket',
                    onConfirm: () => { Store.logout(); location.hash = '#/login'; },
                });

                /* ----------------------- reset data demo ------------------ */
                $('resetDemoBtn').onclick = () => UI.confirm({
                    title: 'Reset Data Demo?',
                    message: 'Semua pesanan, layanan, kategori, dan pengaturan akan dikembalikan ke data contoh awal.',
                    confirmText: 'Ya, Reset', tone: 'red', icon: 'fa-rotate-left',
                    onConfirm: () => {
                        Store.resetDemo();
                        UI.toast('Data demo dikembalikan ke kondisi awal.');
                        location.hash = '#/login';
                    },
                });

                document.addEventListener('keydown', escHandler);
            },
            destroy() {
                document.removeEventListener('keydown', escHandler);
                closeAccountModal();
            },
        };
    }

    global.PagesSettings = { renderPengaturan };
})(window);
