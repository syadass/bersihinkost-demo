/* =============================================================================
 * Bersihinkost DEMO — Kelola Layanan & Harga (+ kategori)
 * Meniru resources/views/admin/layanan/index.blade.php + ServiceController
 * ========================================================================== */
(function (global) {
    'use strict';

    const { esc } = UI;

    const tabOn = 'py-2 rounded-xl text-xs font-extrabold bg-white text-lavender-600 shadow-sm transition-all';
    const tabOff = 'py-2 rounded-xl text-xs font-extrabold text-gray-400 transition-all';

    // status modal (bertahan selama halaman aktif)
    let modalState = { id: null, imageMode: 'url', dataUrl: '', hasImage: false };
    let catState = { old: '' }; // '' = mode tambah, berisi nama = mode ubah
    let reopenCat = false;      // minta init berikutnya membuka modal kategori

    function buildQuery(patch) {
        const p = new URLSearchParams();
        Object.entries(App.query).forEach(([k, v]) => { if (v !== '' && v != null) p.set(k, v); });
        Object.entries(patch).forEach(([k, v]) => {
            if (v === '' || v == null) p.delete(k); else p.set(k, v);
        });
        const s = p.toString();
        return '#/admin/layanan' + (s ? '?' + s : '');
    }

    /* --------------------------- gambar (kecilkan) ------------------------ */
    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error('Tidak ada file.'));
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                return reject(new Error('Format gambar harus JPG, PNG, atau WebP.'));
            }
            if (file.size > 2 * 1024 * 1024) return reject(new Error('Ukuran gambar maks 2MB.'));
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Gagal membaca file.'));
            reader.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error('File gambar tidak valid.'));
                img.onload = () => {
                    const MAX = 900;
                    let w = img.naturalWidth, h = img.naturalHeight;
                    if (w > MAX || h > MAX) {
                        const r = Math.min(MAX / w, MAX / h);
                        w = Math.round(w * r); h = Math.round(h * r);
                    }
                    const cv = document.createElement('canvas');
                    cv.width = w; cv.height = h;
                    cv.getContext('2d').drawImage(img, 0, 0, w, h);
                    try { resolve(cv.toDataURL('image/jpeg', 0.75)); }
                    catch (e) { resolve(String(reader.result)); }
                };
                img.src = String(reader.result);
            };
            reader.readAsDataURL(file);
        });
    }

    /* =========================== halaman layanan ========================= */
    function renderLayanan(query) {
        const user = Store.currentUser();
        const search = query.search || '';
        const category = query.category || 'all';

        const categories = Store.categories();
        const services = Store.services({ search, category });
        const catCount = (name) => Store.db.services.filter(s => s.category === name).length;
        const totalCount = Store.db.services.length;

        const card = (s) => `
        <div class="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-card border border-lavender-50 flex flex-col justify-between group hover:shadow-lg transition-all min-w-0">
            <div class="min-w-0">
                <div class="w-full h-24 sm:h-36 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 overflow-hidden relative bg-lavender-50">
                    ${s.image_url
                        ? `<img src="${esc(s.image_url)}" alt="${esc(s.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`
                        : `<div class="w-full h-full flex items-center justify-center text-lavender-300 text-4xl"><i class="fa-solid fa-broom"></i></div>`}
                    <div class="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-extrabold text-lavender-700 shadow-sm">
                        <i class="fa-regular fa-clock mr-1"></i>${s.duration_minutes} Menit
                    </div>
                    <span class="absolute top-2 left-2 bg-lavender-600 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm">${esc(s.category)}</span>
                    ${!s.is_active ? `<span class="absolute bottom-2 left-2 bg-gray-800/80 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm">NONAKTIF</span>` : ''}
                </div>
                <h3 class="text-xs sm:text-base font-extrabold text-gray-800 mb-0.5 sm:mb-1 leading-tight line-clamp-2">${esc(s.name)}</h3>
                <p class="text-sm sm:text-lg font-extrabold text-peach-500 mb-2 sm:mb-4 truncate">Rp${Store.fmtNumber(s.price)}</p>
            </div>
            <div class="flex gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-gray-100">
                <button data-edit="${s.id}" class="flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-lavender-50 text-lavender-600 text-[11px] sm:text-xs font-extrabold hover:bg-lavender-100 transition-colors flex items-center justify-center gap-1.5 min-w-0">
                    <i class="fa-solid fa-pen-to-square"></i> <span class="hidden min-[380px]:inline">Ubah</span>
                </button>
                <button data-del="${s.id}" title="Hapus Layanan" class="w-10 py-2.5 rounded-xl bg-red-50 text-red-500 text-xs font-extrabold hover:bg-red-100 transition-colors flex items-center justify-center">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>`;

        const catPill = (key, icon, label, count, active) => `
        <a href="${buildQuery({ category: key === 'all' ? '' : key })}" class="${active
            ? 'px-5 py-2.5 rounded-full bg-lavender-600 text-white font-bold text-sm shadow-md flex items-center gap-2 whitespace-nowrap transition-transform hover:scale-105'
            : 'px-5 py-2.5 rounded-full bg-white text-gray-600 font-bold text-sm shadow-card hover:bg-lavender-50 hover:text-lavender-600 transition-all flex items-center gap-2 whitespace-nowrap'}">
            ${icon ? `<i class="fa-solid ${icon} text-xs"></i> ` : ''}${esc(label)} (${count})
        </a>`;

        const filtered = search || category !== 'all';

        const content = `
        <header class="flex flex-col gap-3 mb-5 sm:mb-6 pt-2">
            <div>
                <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Kelola Layanan & Harga</h1>
                <p class="text-xs sm:text-sm font-bold text-lavender-500">Tambah, ubah, atau atur daftar jasa pembersihan kost</p>
            </div>

            <div class="flex flex-col min-[520px]:flex-row min-[520px]:items-center gap-2">
                <form id="svcSearchForm" class="relative flex-1 min-w-0">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400">
                        <i class="fa-solid fa-magnifying-glass text-xs"></i>
                    </span>
                    <input type="text" name="search" value="${esc(search)}" placeholder="Cari layanan..." class="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-3xl bg-white border-none shadow-card text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
                </form>

                <div class="flex items-center gap-2 shrink-0">
                    <button id="openCatBtn" class="flex-1 min-[520px]:flex-none px-4 sm:px-5 py-3 sm:py-3.5 rounded-3xl bg-white text-lavender-600 border border-lavender-200 font-extrabold text-xs sm:text-sm shadow-card hover:bg-lavender-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap" title="Kelola kategori">
                        <i class="fa-solid fa-tags text-xs"></i> <span class="hidden min-[380px]:inline">Kelola Kategori</span><span class="min-[380px]:hidden">Kategori</span>
                    </button>
                    <button id="openSvcBtn" class="flex-1 min-[520px]:flex-none px-4 sm:px-5 py-3 sm:py-3.5 rounded-3xl bg-lavender-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-lavender-200 hover:bg-lavender-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                        <i class="fa-solid fa-plus text-xs"></i> Tambah
                    </button>
                    ${UI.profileChip(user)}
                </div>
            </div>
        </header>

        <div class="flex gap-2 sm:gap-3 mb-4 sm:mb-5 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            ${catPill('all', 'layer-group', 'Semua', totalCount, category === 'all')}
            ${categories.map(c => catPill(c.name, '', c.name, catCount(c.name), category === c.name)).join('')}
        </div>

        <div class="flex-1 overflow-y-auto pb-6 pr-2 min-h-0">
            ${filtered ? `
            <div class="flex items-center gap-3 mb-4">
                <p class="text-xs font-bold text-gray-400">
                    ${services.length} hasil
                    ${search ? ` untuk "<span class="text-gray-700">${esc(search)}</span>"` : ''}
                    ${category !== 'all' ? ` di kategori "<span class="text-gray-700">${esc(category)}</span>"` : ''}
                </p>
                <a href="#/admin/layanan" class="text-xs font-extrabold text-red-500 hover:underline">Reset</a>
            </div>` : ''}

            <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                ${services.map(card).join('')}
            </div>

            ${services.length === 0 ? `
            <div class="flex flex-col items-center justify-center text-center py-16 bg-white rounded-3xl shadow-card border border-lavender-50 mt-5">
                <div class="w-20 h-20 rounded-full bg-lavender-50 text-lavender-300 flex items-center justify-center text-3xl mb-3 border-2 border-dashed border-lavender-200">
                    <i class="fa-solid fa-list-check"></i>
                </div>
                <p class="text-base font-extrabold text-gray-700">${filtered ? 'Layanan tidak ditemukan' : 'Belum ada layanan'}</p>
                <p class="text-xs font-medium text-gray-400 mt-1">${filtered ? 'Coba kata kunci atau kategori lain' : 'Klik "Tambah Layanan Baru" untuk membuat yang pertama'}</p>
            </div>` : ''}
        </div>

        <!-- Modal Form Tambah/Edit Layanan -->
        <div id="serviceModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div class="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-float w-full max-w-md p-5 sm:p-7 border border-lavender-50 relative my-auto max-h-[92vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-5">
                    <h3 id="modalTitle" class="text-xl font-extrabold text-gray-800">Tambah Layanan Baru</h3>
                    <button id="closeSvcModal" class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <i class="fa-solid fa-xmark text-sm"></i>
                    </button>
                </div>

                <form id="serviceForm" class="space-y-4">
                    <div id="svcErrors" class="hidden bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl"></div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama Layanan</label>
                        <input type="text" id="serviceName" required maxlength="100" placeholder="Contoh: Vacuum Kasur" class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1">Kategori</label>
                        ${categories.length > 0 ? `
                        <select id="serviceCategory" required class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                            ${categories.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}
                        </select>
                        <p class="text-[11px] font-semibold text-gray-400 mt-1">Kategori baru? Tambahkan dulu lewat tombol "Atur Kategori".</p>`
                        : `<p class="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">Belum ada kategori. <button type="button" id="gotoCat" class="underline font-extrabold">Tambah kategori dulu</button>.</p>`}
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-extrabold text-gray-600 mb-1">Tarif (Rp)</label>
                            <input type="number" id="servicePrice" required min="0" placeholder="50000" class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                        </div>
                        <div>
                            <label class="block text-xs font-extrabold text-gray-600 mb-1">Durasi (menit)</label>
                            <input type="number" id="serviceDuration" required min="5" max="480" placeholder="45" class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-2">Gambar Layanan <span class="font-semibold text-gray-400">(opsional)</span></label>
                        <div class="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-gray-100 mb-3">
                            <button type="button" id="tabUrl" class="${tabOn}">Link URL</button>
                            <button type="button" id="tabUpload" class="${tabOff}">Unggah File</button>
                        </div>
                        <div id="paneUrl">
                            <input type="url" id="serviceImageUrl" placeholder="https://images.unsplash.com/..." class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                        </div>
                        <div id="paneUpload" class="hidden">
                            <label for="serviceImageFile" class="block cursor-pointer px-4 py-6 rounded-2xl bg-gray-50 border-2 border-dashed border-lavender-200 text-center hover:bg-lavender-50 transition-colors">
                                <i class="fa-solid fa-cloud-arrow-up text-2xl text-lavender-400"></i>
                                <p id="uploadHint" class="text-xs font-extrabold text-gray-600 mt-2">Klik untuk pilih gambar (JPG/PNG/WebP, maks 2MB)</p>
                            </label>
                            <input type="file" id="serviceImageFile" accept="image/jpeg,image/png,image/webp" class="hidden">
                        </div>
                        <div id="imagePreviewWrap" class="hidden mt-3 relative">
                            <img id="imagePreview" src="" alt="Pratinjau" class="w-full h-32 rounded-2xl object-cover border border-gray-200">
                            <button type="button" id="clearImage" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80" title="Hapus gambar">
                                <i class="fa-solid fa-xmark text-xs"></i>
                            </button>
                        </div>
                        <label id="hapusGambarWrap" class="hidden items-center gap-2 text-xs font-extrabold text-red-500 mt-2">
                            <input type="checkbox" id="hapusGambar" class="w-4 h-4 accent-red-500"> Hapus gambar saat ini
                        </label>
                    </div>
                    <label class="flex items-center gap-2 text-xs font-extrabold text-gray-600">
                        <input type="checkbox" id="serviceActive" checked class="w-4 h-4 accent-purple-600"> Tampilkan di halaman publik
                    </label>

                    <div class="pt-4 flex gap-3">
                        <button type="button" id="cancelSvc" class="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Batal</button>
                        <button type="submit" class="flex-1 py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all">Simpan</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal Kelola Kategori -->
        <div id="categoryModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div class="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-float w-full max-w-lg p-5 sm:p-7 border border-lavender-50 relative my-auto max-h-[92vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-5">
                    <div>
                        <h3 class="text-xl font-extrabold text-gray-800">Kelola Kategori Layanan</h3>
                        <p class="text-xs font-semibold text-gray-400">Tambah, ubah, atau hapus kategori</p>
                    </div>
                    <button id="closeCatModal" class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <i class="fa-solid fa-xmark text-sm"></i>
                    </button>
                </div>

                <form id="categoryForm" class="bg-lavender-50/50 p-4 rounded-2xl border border-lavender-100 mb-5 flex gap-2">
                    <div id="catErrors" class="hidden w-full bg-red-50 border border-red-200 text-red-500 text-[11px] font-bold px-3 py-2 rounded-xl"></div>
                    <input type="text" id="categoryNameInput" required maxlength="50" placeholder="Nama Kategori Baru..." class="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                    <button type="submit" id="categorySubmitBtn" class="px-5 py-2.5 rounded-xl bg-lavender-600 text-white font-extrabold text-xs shadow-md hover:bg-lavender-700 transition-all whitespace-nowrap">Tambah</button>
                    <button type="button" id="categoryCancelBtn" class="hidden px-3 py-2.5 rounded-xl bg-gray-200 text-gray-600 font-extrabold text-xs hover:bg-gray-300 transition-all whitespace-nowrap">Batal</button>
                </form>

                <div class="max-h-60 overflow-y-auto space-y-2 pr-1">
                    ${categories.length ? categories.map(c => `
                    <div class="bg-gray-50 px-4 py-3 rounded-2xl flex items-center justify-between border border-gray-100">
                        <span class="text-sm font-extrabold text-gray-800">${esc(c.name)} <span class="text-[10px] font-extrabold text-gray-400">(${catCount(c.name)})</span></span>
                        <div class="flex items-center gap-2">
                            <button data-catedit="${esc(c.name)}" class="px-3 py-1.5 rounded-xl bg-lavender-50 text-lavender-600 text-xs font-extrabold hover:bg-lavender-100 transition-colors">
                                <i class="fa-solid fa-pen mr-1"></i> Ubah
                            </button>
                            <button data-catdel="${esc(c.name)}" class="px-3 py-1.5 rounded-xl bg-red-50 text-red-500 text-xs font-extrabold hover:bg-red-100 transition-colors">
                                <i class="fa-solid fa-trash-can mr-1"></i> Hapus
                            </button>
                        </div>
                    </div>`).join('')
                    : `<p class="text-center text-xs text-gray-400 py-4 font-bold">Belum ada kategori.</p>`}
                </div>

                <div class="mt-6 pt-4 border-t border-gray-100 text-right">
                    <button type="button" id="selesaiCat" class="px-6 py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-xs shadow-md hover:bg-lavender-700 transition-all">Selesai</button>
                </div>
            </div>
        </div>`;

        return {
            title: 'Kelola Layanan & Harga - Bersihinkost',
            layout: () => AdminLayout.adminLayout('layanan', content),
            init() {
                /* ------------------------- cari ------------------------- */
                document.getElementById('svcSearchForm').onsubmit = (e) => {
                    e.preventDefault();
                    location.hash = buildQuery({ search: e.target.search.value.trim(), category: '' });
                };

                /* --------------------- modal layanan --------------------- */
                const modal = document.getElementById('serviceModal');
                const svcForm = document.getElementById('serviceForm');
                const errBox = document.getElementById('svcErrors');
                const urlInput = document.getElementById('serviceImageUrl');
                const fileInput = document.getElementById('serviceImageFile');
                const previewWrap = document.getElementById('imagePreviewWrap');
                const previewImg = document.getElementById('imagePreview');
                const uploadHint = document.getElementById('uploadHint');
                const hapusWrap = document.getElementById('hapusGambarWrap');
                const hapusChk = document.getElementById('hapusGambar');

                const showErr = (m) => {
                    if (!m) { errBox.classList.add('hidden'); errBox.textContent = ''; return; }
                    errBox.textContent = m;
                    errBox.classList.remove('hidden');
                };

                function setImageMode(mode) {
                    modalState.imageMode = mode;
                    const isUrl = mode === 'url';
                    document.getElementById('paneUrl').classList.toggle('hidden', !isUrl);
                    document.getElementById('paneUpload').classList.toggle('hidden', isUrl);
                    document.getElementById('tabUrl').className = isUrl ? tabOn : tabOff;
                    document.getElementById('tabUpload').className = isUrl ? tabOff : tabOn;
                    if (isUrl) { fileInput.value = ''; uploadHint.innerText = 'Klik untuk pilih gambar (JPG/PNG/WebP, maks 2MB)'; }
                    else { urlInput.value = ''; }
                    refreshPreview();
                }

                function refreshPreview() {
                    const src = modalState.imageMode === 'upload'
                        ? (modalState.dataUrl || (modalState.hasImage ? modalState.existingUrl : ''))
                        : (urlInput.value.trim() || (modalState.hasImage && !hapusChk.checked ? modalState.existingUrl : ''));
                    if (src) { previewImg.src = src; previewWrap.classList.remove('hidden'); }
                    else { previewImg.removeAttribute('src'); previewWrap.classList.add('hidden'); }
                }

                function clearImageInput() {
                    modalState.dataUrl = '';
                    urlInput.value = '';
                    fileInput.value = '';
                    uploadHint.innerText = 'Klik untuk pilih gambar (JPG/PNG/WebP, maks 2MB)';
                    hapusChk.checked = false;
                    refreshPreview();
                }

                function openServiceModal(id) {
                    showErr('');
                    modalState = { id: id || null, imageMode: 'url', dataUrl: '', hasImage: false, existingUrl: '' };
                    catState.old = '';
                    document.getElementById('modalTitle').innerText = id ? 'Ubah Layanan & Harga' : 'Tambah Layanan Baru';
                    document.getElementById('serviceName').value = '';
                    document.getElementById('servicePrice').value = '';
                    document.getElementById('serviceDuration').value = '';
                    document.getElementById('serviceActive').checked = true;
                    urlInput.value = '';
                    fileInput.value = '';
                    uploadHint.innerText = 'Klik untuk pilih gambar (JPG/PNG/WebP, maks 2MB)';
                    hapusChk.checked = false;
                    hapusWrap.classList.add('hidden');
                    hapusWrap.classList.remove('flex');

                    if (id) {
                        const s = Store.service(id);
                        if (!s) return;
                        modalState.hasImage = !!s.image_url;
                        modalState.existingUrl = s.image_url || '';
                        document.getElementById('serviceName').value = s.name;
                        const sel = document.getElementById('serviceCategory');
                        if (sel) sel.value = s.category;
                        document.getElementById('servicePrice').value = s.price;
                        document.getElementById('serviceDuration').value = s.duration_minutes;
                        document.getElementById('serviceActive').checked = !!s.is_active;
                        if (s.image_url && /^https?:\/\//i.test(s.image_url)) urlInput.value = s.image_url;
                        if (s.image_url) {
                            hapusWrap.classList.remove('hidden');
                            hapusWrap.classList.add('flex');
                        }
                    }
                    setImageMode('url');
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                }
                function closeServiceModal() {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }

                document.getElementById('openSvcBtn').onclick = () => openServiceModal(null);
                document.getElementById('closeSvcModal').onclick = closeServiceModal;
                document.getElementById('cancelSvc').onclick = closeServiceModal;
                modal.onclick = (e) => { if (e.target === modal) closeServiceModal(); };
                document.getElementById('tabUrl').onclick = () => setImageMode('url');
                document.getElementById('tabUpload').onclick = () => setImageMode('upload');
                document.getElementById('clearImage').onclick = clearImageInput;
                urlInput.oninput = refreshPreview;
                hapusChk.onchange = refreshPreview;
                const gotoCat = document.getElementById('gotoCat');
                if (gotoCat) gotoCat.onclick = () => { closeServiceModal(); openCategoryModal(); };

                fileInput.onchange = () => {
                    const f = fileInput.files[0];
                    if (!f) return;
                    fileToDataUrl(f).then((dataUrl) => {
                        modalState.dataUrl = dataUrl;
                        uploadHint.innerText = f.name + ' (dikecilkan otomatis)';
                        refreshPreview();
                    }).catch((err) => {
                        fileInput.value = '';
                        UI.toast(err.message || 'Gagal memproses gambar.', 'err');
                    });
                };

                svcForm.onsubmit = (e) => {
                    e.preventDefault();
                    showErr('');
                    const catSel = document.getElementById('serviceCategory');
                    if (!catSel) { closeServiceModal(); openCategoryModal(); return; }

                    // tentukan gambar akhir
                    let imageUrl = null;
                    if (hapusChk.checked && !modalState.dataUrl) imageUrl = null;
                    else if (modalState.imageMode === 'upload' && modalState.dataUrl) imageUrl = modalState.dataUrl;
                    else if (modalState.imageMode === 'url' && urlInput.value.trim()) imageUrl = urlInput.value.trim();
                    else if (modalState.hasImage && !hapusChk.checked) imageUrl = modalState.existingUrl;

                    const payload = {
                        name: document.getElementById('serviceName').value.trim(),
                        category: catSel.value,
                        price: Number(document.getElementById('servicePrice').value),
                        duration_minutes: Number(document.getElementById('serviceDuration').value),
                        image_url: imageUrl,
                        is_active: document.getElementById('serviceActive').checked,
                    };
                    const res = modalState.id
                        ? Store.updateService(modalState.id, payload)
                        : Store.createService(payload);
                    if (!res.ok) { showErr(res.message); return; }
                    closeServiceModal();
                    UI.toast(res.message);
                    App.render();
                };

                document.querySelectorAll('[data-edit]').forEach(btn => {
                    btn.onclick = () => openServiceModal(Number(btn.dataset.edit));
                });
                document.querySelectorAll('[data-del]').forEach(btn => {
                    btn.onclick = () => {
                        const id = Number(btn.dataset.del);
                        const s = Store.service(id);
                        if (!s) return;
                        UI.confirm({
                            title: 'Hapus Layanan?',
                            message: `Layanan "${s.name}" akan dihapus/dinonaktifkan.`,
                            confirmText: 'Ya, Hapus', tone: 'red', icon: 'fa-trash-can',
                            onConfirm: () => {
                                const r = Store.deleteService(id);
                                UI.toast(r.message, r.ok ? 'ok' : 'err');
                                if (r.ok) App.render();
                            },
                        });
                    };
                });

                /* --------------------- modal kategori --------------------- */
                const catModal = document.getElementById('categoryModal');
                const catForm = document.getElementById('categoryForm');
                const catInput = document.getElementById('categoryNameInput');
                const catSubmit = document.getElementById('categorySubmitBtn');
                const catCancel = document.getElementById('categoryCancelBtn');
                const catErr = document.getElementById('catErrors');

                const showCatErr = (m) => {
                    if (!m) { catErr.classList.add('hidden'); catErr.textContent = ''; return; }
                    catErr.textContent = m;
                    catErr.classList.remove('hidden');
                };

                function resetCategoryForm() {
                    catState.old = '';
                    catInput.value = '';
                    catSubmit.innerText = 'Tambah';
                    catCancel.classList.add('hidden');
                    showCatErr('');
                }
                function openCategoryModal() {
                    resetCategoryForm();
                    catModal.classList.remove('hidden');
                    catModal.classList.add('flex');
                }
                function closeCategoryModal() {
                    catModal.classList.add('hidden');
                    catModal.classList.remove('flex');
                }

                document.getElementById('openCatBtn').onclick = openCategoryModal;
                document.getElementById('closeCatModal').onclick = closeCategoryModal;
                document.getElementById('selesaiCat').onclick = closeCategoryModal;
                catModal.onclick = (e) => { if (e.target === catModal) closeCategoryModal(); };
                catCancel.onclick = resetCategoryForm;

                catForm.onsubmit = (e) => {
                    e.preventDefault();
                    showCatErr('');
                    const name = catInput.value.trim();
                    const res = catState.old
                        ? Store.renameCategory(catState.old, name)
                        : Store.addCategory(name);
                    if (!res.ok) { showCatErr(res.message); return; }
                    UI.toast(res.message);
                    reopenCat = true;
                    App.render();
                };

                document.querySelectorAll('[data-catedit]').forEach(btn => {
                    btn.onclick = () => {
                        const name = btn.dataset.catedit;
                        catState.old = name;
                        catInput.value = name;
                        catSubmit.innerText = 'Perbarui';
                        catCancel.classList.remove('hidden');
                        showCatErr('');
                        catInput.focus();
                    };
                });
                document.querySelectorAll('[data-catdel]').forEach(btn => {
                    btn.onclick = () => {
                        const name = btn.dataset.catdel;
                        UI.confirm({
                            title: 'Hapus Kategori?',
                            message: `Kategori "${name}" akan dihapus dari daftar.`,
                            confirmText: 'Ya, Hapus', tone: 'red', icon: 'fa-trash-can',
                            onConfirm: () => {
                                const r = Store.deleteCategory(name);
                                UI.toast(r.message, r.ok ? 'ok' : 'err');
                                if (r.ok) { reopenCat = true; App.render(); }
                            },
                        });
                    };
                });

                document.addEventListener('keydown', escHandler);

                // render ulang karena aksi kategori -> buka lagi modal kategorinya
                if (reopenCat) {
                    reopenCat = false;
                    openCategoryModal();
                }
            },
            destroy() {
                document.removeEventListener('keydown', escHandler);
            },
        };
    }

    /** tutup semua modal layanan dengan tombol Escape */
    function escHandler(e) {
        if (e.key !== 'Escape') return;
        ['serviceModal', 'categoryModal'].forEach(id => {
            const m = document.getElementById(id);
            if (m && !m.classList.contains('hidden')) {
                m.classList.add('hidden');
                m.classList.remove('flex');
            }
        });
    }

    global.PagesServices = { renderLayanan };
})(window);
