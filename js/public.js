/* =============================================================================
 * Bersihinkost DEMO — Halaman Publik (Customer): Beranda & Sukses
 * ========================================================================== */
(function (global) {
    'use strict';

    const { esc, fmtRp, fmtDateTimeLong, fmtDate } = { esc: UI.esc, fmtRp: Store.fmtRp, fmtDateTimeLong: Store.fmtDateTimeLong, fmtDate: Store.fmtDate };
    const CUR = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    function publicHeader(setting) {
        return `
        <header class="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-lavender-100 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2 shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <div class="w-9 h-9 sm:w-10 sm:h-10 bg-lavender-600 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0">
                    <i class="fa-solid fa-broom text-sm"></i>
                </div>
                <div class="min-w-0">
                    <h1 class="text-base sm:text-xl font-extrabold text-gray-800 tracking-tight truncate">${esc(setting.business_name)}</h1>
                    <p class="text-[10px] sm:text-[11px] font-bold text-lavender-500 truncate">Layanan Kebersihan Khusus Anak Kost</p>
                </div>
            </div>
            <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                ${setting.is_open
                    ? `<span class="hidden sm:inline-block text-xs font-bold bg-lavender-50 text-lavender-600 px-4 py-2 rounded-full border border-lavender-100">
                        <i class="fa-solid fa-circle text-[8px] text-emerald-500 mr-1.5 animate-pulse"></i> Buka Hari Ini · ${esc(setting.jam_mulai)}–${esc(setting.jam_selesai)}
                       </span>`
                    : `<span class="hidden sm:inline-block text-xs font-bold bg-red-50 text-red-500 px-4 py-2 rounded-full border border-red-100">Tutup Sementara</span>`}
                <a href="#/login" class="px-3 sm:px-4 py-2 rounded-full bg-peach-500 text-white font-extrabold text-[11px] sm:text-xs shadow-md hover:bg-peach-600 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                    <i class="fa-solid fa-lock text-[10px]"></i> <span class="hidden min-[400px]:inline">Login Pengelola</span><span class="min-[400px]:hidden">Login</span>
                </a>
            </div>
        </header>`;
    }

    function renderHome() {
        const setting = Store.settings();
        const services = Store.activeServices().map(s => ({
            id: s.id, name: s.name, category: s.category, price: s.price,
            duration: s.duration_minutes + ' Menit', durationMin: s.duration_minutes,
            image: s.image_url || 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=300&h=300&fit=crop',
        }));
        const categories = [...new Set(Store.activeServices().map(s => s.category))].sort();
        const closedDates = Store.closedDatesFrom(Store.todayStr());
        const minTanggal = Store.minTanggal();

        return {
            title: `${setting.business_name} - Jasa Bersih-Bersih Kost Panggilan`,
            html: `
            <div class="min-h-screen flex flex-col selection:bg-peach-400 selection:text-white">
                ${publicHeader(setting)}

                <main class="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
                    <div class="lg:col-span-2 flex flex-col min-w-0">
                        <div class="bg-gradient-to-r from-lavender-600 to-lavender-800 rounded-3xl p-5 sm:p-8 text-white mb-4 sm:mb-6 shadow-float relative overflow-hidden flex flex-col justify-center">
                            <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                            <span class="bg-white/20 text-white w-max px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-bold mb-3 backdrop-blur-sm">Kost Bersih, Pikiran Tenang ✨</span>
                            <h2 class="text-xl sm:text-3xl font-extrabold mb-2 leading-tight">Kamar Berantakan? Panggil Jasa Bersih Sekarang!</h2>
                            <p class="text-lavender-100 text-xs sm:text-sm max-w-xl font-medium">Pilih paket pembersihan favoritmu, isi nama, alamat & tanggal usulan — pesanan tercatat otomatis dan kamu langsung terhubung ke WhatsApp pengelola.</p>
                        </div>

                        <div class="flex gap-2 sm:gap-3 mb-4 sm:mb-5 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0" id="categoryContainer">
                            <button data-cat="All" class="cat-btn px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-lavender-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 whitespace-nowrap"><i class="fa-solid fa-star text-[10px] sm:text-xs"></i> Semua Layanan</button>
                            ${categories.map(c => `<button data-cat="${esc(c)}" class="cat-btn px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-gray-600 font-bold text-xs sm:text-sm shadow-card hover:bg-lavender-50 hover:text-lavender-600 transition-all flex items-center gap-2 whitespace-nowrap">${esc(c)}</button>`).join('')}
                        </div>

                        <div id="productGrid" class="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pb-6"></div>
                    </div>

                    <div class="bg-white rounded-3xl shadow-card p-4 sm:p-6 flex flex-col h-fit border border-lavender-50 lg:sticky lg:top-24">
                        <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                            <h3 class="text-xl font-extrabold text-gray-800">Detail Pesananmu</h3>
                            <button id="clearCartBtn" class="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-full transition-colors">Kosongkan</button>
                        </div>

                        <div class="space-y-3 mb-4">
                            <div>
                                <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama <span class="text-peach-500">*</span></label>
                                <input type="text" id="customerName" placeholder="Contoh: Budi Santoso" class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                            </div>
                            <div>
                                <label class="block text-xs font-extrabold text-gray-600 mb-1">Alamat Kost / Kamar <span class="text-peach-500">*</span></label>
                                <textarea id="alamat" rows="2" placeholder="Contoh: Kost Mawar Jl. Slamet Riyadi No.12, Kamar 5" class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400"></textarea>
                            </div>
                            <div>
                                <label class="block text-xs font-extrabold text-gray-600 mb-1">Tanggal & Jam Usulan <span class="text-peach-500">*</span></label>
                                <div class="grid grid-cols-2 gap-2">
                                    <input type="date" id="tanggalUsulan" min="${minTanggal}" value="${minTanggal}" class="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                                    <input type="time" id="jamUsulan" min="${esc(setting.jam_mulai)}" max="${esc(setting.jam_selesai)}" value="${(setting.jam_mulai <= '09:00' && '09:00' <= setting.jam_selesai) ? '09:00' : esc(setting.jam_mulai)}" class="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                                </div>
                                ${setting.catatan_publik ? `<p class="text-[11px] text-gray-400 font-semibold mt-1">${esc(setting.catatan_publik)}</p>` : ''}
                                ${!setting.is_open
                                    ? `<p class="text-[11px] font-extrabold text-amber-600 mt-1">Sedang tutup — order tetap kami terima, pengerjaan paling cepat besok.</p>`
                                    : `<p class="text-[11px] text-gray-400 font-semibold mt-1">Pengerjaan pukul ${esc(setting.jam_mulai)}–${esc(setting.jam_selesai)} WIB. Tanggal libur tidak bisa dipilih.</p>`}
                            </div>
                        </div>

                        <div id="cartList" class="flex-1 max-h-60 overflow-y-auto space-y-3 mb-4 pr-1">
                            <div id="emptyCart" class="py-8 text-center text-gray-400">
                                <i class="fa-solid fa-cart-shopping text-3xl mb-2 text-lavender-200"></i>
                                <p class="text-sm font-bold">Belum ada layanan dipilih</p>
                                <p class="text-xs text-gray-400">Klik salah satu layanan di samping</p>
                            </div>
                        </div>

                        <div class="space-y-2 mb-5 border-t border-dashed border-gray-200 pt-4">
                            <div class="flex justify-between items-center text-sm font-bold text-gray-500">
                                <span>Estimasi Pengerjaan</span><span id="timeText">0 Menit</span>
                            </div>
                            <div class="flex justify-between items-center pt-2">
                                <span class="text-base font-extrabold text-gray-800">Total Biaya</span>
                                <span id="totalText" class="text-xl font-extrabold text-lavender-600">Rp 0</span>
                            </div>
                        </div>

                        <button id="checkoutBtn" disabled class="w-full py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-lg shadow-lavender-200 hover:bg-lavender-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2">
                            <i class="fa-brands fa-whatsapp text-lg"></i> <span id="checkoutLabel">Pesan via WhatsApp</span>
                        </button>
                        <p id="orderMsg" class="hidden text-xs font-bold text-center mt-2"></p>
                    </div>
                </main>

                <footer class="text-center py-6 text-xs font-bold text-gray-400 border-t border-lavender-100 mt-auto">
                    &copy; ${new Date().getFullYear()} ${esc(setting.business_name)} ${esc(setting.operator_name)}. Dikelola Secara Mandiri.
                </footer>
            </div>`,
            init() {
                let cart = [];
                let currentFilter = 'All';
                const grid = document.getElementById('productGrid');
                const cartList = document.getElementById('cartList');
                const emptyCart = document.getElementById('emptyCart');
                const checkoutBtn = document.getElementById('checkoutBtn');
                const msg = document.getElementById('orderMsg');

                const showMsg = (text, tone = 'err') => {
                    msg.className = `text-xs font-bold text-center mt-2 ${tone === 'err' ? 'text-red-500' : 'text-emerald-500'}`;
                    msg.textContent = text;
                    msg.classList.remove('hidden');
                };
                const hideMsg = () => msg.classList.add('hidden');

                // validasi tanggal saat berubah
                document.getElementById('tanggalUsulan').addEventListener('change', (e) => {
                    const err = Store.validateJadwal(e.target.value, document.getElementById('jamUsulan').value);
                    if (err) {
                        showMsg(err);
                        e.target.value = minTanggal;
                    } else hideMsg();
                });
                document.getElementById('jamUsulan').addEventListener('change', () => {
                    const err = Store.validateJadwal(document.getElementById('tanggalUsulan').value, document.getElementById('jamUsulan').value);
                    if (err) showMsg(err); else hideMsg();
                });

                // filter kategori
                document.querySelectorAll('.cat-btn').forEach(b => b.addEventListener('click', () => {
                    currentFilter = b.dataset.cat;
                    document.querySelectorAll('.cat-btn').forEach(x => x.className = 'cat-btn px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-gray-600 font-bold text-xs sm:text-sm shadow-card hover:bg-lavender-50 hover:text-lavender-600 transition-all flex items-center gap-2 whitespace-nowrap');
                    b.className = 'cat-btn px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-lavender-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 whitespace-nowrap transition-transform hover:scale-105';
                    renderGrid();
                }));

                function renderGrid() {
                    grid.innerHTML = '';
                    const filtered = currentFilter === 'All' ? services : services.filter(p => p.category === currentFilter);
                    if (!filtered.length) {
                        grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-400 font-bold">Layanan tidak tersedia.</div>';
                        return;
                    }
                    filtered.forEach(p => {
                        const card = document.createElement('div');
                        card.className = 'bg-white p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl shadow-card hover:shadow-lg transition-all cursor-pointer flex flex-col h-full border border-lavender-50 group min-w-0';
                        card.onclick = () => addToCart(p.id);
                        card.innerHTML = `<div class="w-full h-24 sm:h-32 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 overflow-hidden relative">
                            <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                            <div class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-white/90 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold text-lavender-700">${esc(p.duration)}</div></div>
                            <div class="flex flex-col flex-1 min-w-0"><span class="text-[9px] sm:text-[10px] font-extrabold uppercase text-lavender-400 tracking-wider mb-0.5 sm:mb-1 truncate">${esc(p.category)}</span>
                            <h4 class="text-xs sm:text-sm font-extrabold text-gray-800 leading-tight mb-1 sm:mb-2 line-clamp-2">${esc(p.name)}</h4>
                            <div class="mt-auto flex justify-between items-center gap-1 pt-1 sm:pt-2"><span class="text-xs sm:text-sm font-extrabold text-peach-500 truncate">${esc(fmtRp(p.price))}</span>
                            <span class="w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center group-hover:bg-lavender-600 group-hover:text-white transition-colors"><i class="fa-solid fa-plus text-[10px] sm:text-xs"></i></span></div></div>`;
                        grid.appendChild(card);
                    });
                }

                function addToCart(id) {
                    const p = services.find(x => x.id === id);
                    const ex = cart.find(i => i.id === id);
                    ex ? ex.qty++ : cart.push({ id: p.id, name: p.name, price: p.price, qty: 1, durationMin: p.durationMin });
                    updateCart();
                }
                function updateQty(id, d) {
                    const i = cart.findIndex(x => x.id === id);
                    if (i > -1) { cart[i].qty += d; if (cart[i].qty <= 0) cart.splice(i, 1); updateCart(); }
                }
                function clearCart() { cart = []; updateCart(); }
                document.getElementById('clearCartBtn').onclick = clearCart;

                function updateCart() {
                    emptyCart.style.display = cart.length ? 'none' : 'block';
                    checkoutBtn.disabled = !cart.length;
                    cartList.querySelectorAll('.cart-item').forEach(i => i.remove());
                    let sub = 0, mins = 0;
                    cart.forEach(item => {
                        sub += item.qty * item.price;
                        mins += item.qty * item.durationMin;
                        const div = document.createElement('div');
                        div.className = 'cart-item bg-gray-50 p-3 rounded-2xl flex items-center justify-between border border-gray-100';
                        div.innerHTML = `<div class="flex-1 pr-2"><h5 class="text-xs font-extrabold text-gray-800">${esc(item.name)}</h5><p class="text-[11px] font-bold text-peach-500">${esc(CUR.format(item.price * item.qty))}</p></div>
                        <div class="flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm">
                        <button class="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-red-500" data-act="dec"><i class="fa-solid fa-minus text-[8px]"></i></button>
                        <span class="w-5 text-center text-xs font-bold text-gray-800">${item.qty}</span>
                        <button class="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-lavender-50 hover:text-lavender-500" data-act="inc"><i class="fa-solid fa-plus text-[8px]"></i></button></div>`;
                        div.querySelector('[data-act=dec]').onclick = () => updateQty(item.id, -1);
                        div.querySelector('[data-act=inc]').onclick = () => updateQty(item.id, 1);
                        cartList.appendChild(div);
                    });
                    document.getElementById('timeText').innerText = mins + ' Menit';
                    document.getElementById('totalText').innerText = CUR.format(sub);
                }

                function checkout() {
                    const name = UI.val('customerName');
                    const alamat = UI.val('alamat');
                    const tanggal = UI.val('tanggalUsulan');
                    const jam = UI.val('jamUsulan');
                    if (!name || !alamat || !tanggal || !jam) return showMsg('Mohon isi Nama, Alamat, Tanggal, dan Jam Usulan!');
                    const err = Store.validateJadwal(tanggal, jam);
                    if (err) return showMsg(err);
                    if (!cart.length) return;

                    checkoutBtn.disabled = true;
                    document.getElementById('checkoutLabel').textContent = 'Menyimpan...';

                    const res = Store.createOrder({
                        customer_name: name, alamat,
                        tanggal_usulan: tanggal, jam_usulan: jam,
                        items: cart.map(c => ({ service_id: c.id, qty: c.qty })),
                    });
                    if (!res.ok) {
                        showMsg(res.message);
                        checkoutBtn.disabled = false;
                        document.getElementById('checkoutLabel').textContent = 'Pesan via WhatsApp';
                        return;
                    }
                    // catat + buka WhatsApp (demo: tab baru boleh diblokir browser, tidak masalah)
                    try { window.open(Store.waLink(res.order), '_blank'); } catch (e) { /* noop */ }
                    location.hash = `#/sukses/${res.order.id}`;
                }
                checkoutBtn.onclick = checkout;

                renderGrid();
                updateCart();
            },
        };
    }

    function renderSuccess(params) {
        const order = Store.order(params.id);
        const setting = Store.settings();
        if (!order) {
            return { title: 'Pesanan Tidak Ditemukan', html: `
                <div class="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                    <p class="font-extrabold text-gray-700 mb-4">Pesanan tidak ditemukan (data demo tersimpan per-browser).</p>
                    <a href="#/" class="px-6 py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm">Kembali ke Beranda</a>
                </div>` };
        }
        return {
            title: 'Pesanan Terkirim - Bersihinkost',
            html: `
            <div class="min-h-screen flex flex-col selection:bg-peach-400 selection:text-white">
                ${publicHeader(setting)}
                <div class="flex-1 flex items-center justify-center p-4 sm:p-6">
                    <div class="bg-white rounded-3xl shadow-float p-5 sm:p-8 max-w-lg w-full text-center border border-lavender-100">
                        <div class="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                            <i class="fa-solid fa-circle-check"></i>
                        </div>
                        <h1 class="text-2xl font-extrabold text-gray-800 mb-1">Pesanan #${order.id} Tercatat!</h1>
                        <p class="text-sm font-bold text-amber-500 mb-4"><i class="fa-solid fa-hourglass-half mr-1"></i> Status: Menunggu Konfirmasi (ACC) Pengelola</p>
                        <div class="bg-gray-50 rounded-2xl p-4 text-left text-sm font-semibold text-gray-600 space-y-1 mb-4">
                            <p><span class="font-extrabold">Nama:</span> ${esc(order.customer_name)}</p>
                            <p><span class="font-extrabold">Alamat:</span> ${esc(order.alamat)}</p>
                            <p><span class="font-extrabold">Tanggal Usulan:</span> ${esc(fmtDateTimeLong(order.tanggal_usulan))} WIB</p>
                            <p><span class="font-extrabold">Total:</span> Rp${Store.fmtNumber(order.total_harga)} (${order.estimasi_menit} mnt)</p>
                        </div>
                        <p class="text-xs text-gray-400 font-bold mb-4">Chat WhatsApp seharusnya sudah terbuka otomatis. Jika belum, klik tombol di bawah:</p>
                        <a href="${esc(Store.waLink(order))}" target="_blank" rel="noopener" class="block w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-extrabold text-sm shadow-lg hover:brightness-95 transition-all mb-3">
                            <i class="fa-brands fa-whatsapp text-lg mr-2"></i>Buka WhatsApp Pengelola
                        </a>
                        <a href="#/" class="block w-full py-3 rounded-2xl bg-lavender-50 text-lavender-600 font-extrabold text-sm hover:bg-lavender-100 transition-all">Kembali ke Beranda</a>
                    </div>
                </div>
            </div>`,
        };
    }

    global.PagesPublic = { renderHome, renderSuccess };
})(window);
