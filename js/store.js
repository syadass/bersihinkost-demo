/* =============================================================================
 * Bersihinkost DEMO — Lapisan data (localStorage)
 * Semua data disimpan di localStorage browser (per-tab / per-browser).
 * Tidak ada server: semua operasi CRUD dilakukan di sini.
 * ========================================================================== */
(function (global) {
    'use strict';

    const KEY = 'bersihinkost_demo_v1';
    const SESSION_KEY = 'bersihinkost_demo_session';

    /* ----------------------------- util umum ----------------------------- */
    const pad = (n) => String(n).padStart(2, '0');

    function ymd(date) {
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    }
    function todayStr() { return ymd(new Date()); }
    function addDays(dateStr, n) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        dt.setDate(dt.getDate() + n);
        return ymd(dt);
    }
    function nowStamp() {
        const d = new Date();
        return ymd(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function stampDaysAgo(days, hour, minute) {
        const d = new Date();
        d.setDate(d.getDate() - days);
        d.setHours(hour, minute, 0, 0);
        return ymd(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function stampHoursAgo(hours) {
        const d = new Date(Date.now() - hours * 3600 * 1000);
        return ymd(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function dayOf(dt) { return (dt || '').slice(0, 10); }
    function timeOf(dt) { return (dt || '').slice(11, 16); }

    /* --------------------------- format tampilan -------------------------- */
    const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    function fmtNumber(n) { return Number(n || 0).toLocaleString('id-ID'); }
    function fmtRp(n) { return 'Rp' + fmtNumber(n); }
    function fmtDate(dt) { // 12 Oct 2026
        if (!dt) return '-';
        const [d, m, y] = dayOf(dt).split('-');
        return `${Number(d)} ${MONTHS_SHORT[Number(m) - 1]} ${y}`;
    }
    function fmtDateLong(dt) { // 12 Oktober 2026
        if (!dt) return '-';
        const [d, m, y] = dayOf(dt).split('-');
        return `${Number(d)} ${MONTHS_ID[Number(m) - 1]} ${y}`;
    }
    function fmtDateTime(dt) { // 12 Oct 2026, 09:15
        if (!dt) return '-';
        return `${fmtDate(dt)}, ${timeOf(dt)}`;
    }
    function fmtDateTimeLong(dt) {
        if (!dt) return '-';
        return `${fmtDateLong(dt)}, ${timeOf(dt)}`;
    }
    function weekdayLong(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        return DAYS_ID[new Date(y, m - 1, d).getDay()];
    }
    function monthName(m) { return MONTHS_ID[m - 1]; }

    /* -------------------------------- status ------------------------------ */
    const STATUS = {
        pending:     { label: 'Menunggu ACC',  badge: 'bg-amber-100 text-amber-700 border-amber-200',  chip: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400' },
        rescheduled: { label: 'Pindah Tanggal', badge: 'bg-blue-100 text-blue-700 border-blue-200',    chip: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400' },
        confirmed:   { label: 'Terjadwal',      badge: 'bg-lavender-100 text-lavender-700 border-lavender-200', chip: 'bg-lavender-100 text-lavender-700', dot: 'bg-lavender-400' },
        completed:   { label: 'Selesai',        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', chip: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
        cancelled:   { label: 'Batal',          badge: 'bg-red-100 text-red-500 border-red-200',       chip: 'bg-red-100 text-red-500',       dot: 'bg-red-400' },
    };
    const STATUS_INVOICE = Object.assign({}, STATUS, {
        completed: { label: 'Lunas / Selesai', badge: '', chip: '', dot: '' },
    });

    /* ------------------------------ seed data ----------------------------- */
    function seed() {
        const now = nowStamp();

        const services = [
            ['Deep Cleaning Total', 'Deep Cleaning', 75000, 90, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=300&fit=crop'],
            ['Kuras & Sikat Kamar Mandi', 'Kamar Mandi', 40000, 45, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300&h=300&fit=crop'],
            ['Cuci & Service AC Kost', 'Cuci AC', 85000, 60, 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=300&fit=crop'],
            ['Bersih Ringan & Sapu Pel', 'Reguler', 25000, 30, 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=300&h=300&fit=crop'],
            ['Cuci Kasur / Vacuum Tungau', 'Deep Cleaning', 60000, 45, 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=300&h=300&fit=crop'],
            ['Pembersihan Kerak Dinding KM', 'Kamar Mandi', 45000, 40, 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=300&h=300&fit=crop'],
        ].map((s, i) => ({
            id: i + 1,
            name: s[0], category: s[1], price: s[2], duration_minutes: s[3],
            image_url: s[4], is_active: true, created_at: now, updated_at: now,
        }));

        const catNames = [...new Set(services.map(s => s.category))].sort();
        const categories = catNames.map((n, i) => ({ id: i + 1, name: n, created_at: now, updated_at: now }));

        const orders = [];
        const svc = (id) => services.find(s => s.id === id);

        function makeOrder(o) {
            const items = o.items.map(([sid, qty]) => {
                const s = svc(sid);
                return {
                    service_id: s.id, service_name: s.name, qty,
                    harga_satuan: s.price, subtotal: s.price * qty,
                };
            });
            const total = items.reduce((a, b) => a + b.subtotal, 0);
            const est = items.reduce((a, b) => a + b.qty * svc(b.service_id).duration_minutes, 0);
            // pastikan selalu ada komponen jam (mirip kolom datetime di Laravel)
            const withTime = (dt, fallback) => (dt ? String(dt).slice(0, 10) : null)
                ? (String(dt).length > 10 ? dt : String(dt).slice(0, 10) + ' ' + fallback)
                : null;
            const order = {
                id: orders.length + 1,
                customer_name: o.name, alamat: o.alamat,
                tanggal_usulan: withTime(o.usulan, '09:00'),
                tanggal_fix: withTime(o.fix, '10:00'),
                total_harga: total, estimasi_menit: est,
                status: o.status, alasan_batal: o.alasan || null, catatan_admin: o.catatan || null,
                created_at: o.created, updated_at: o.updated || o.created,
                items,
            };
            orders.push(order);
            return order;
        }

        const names = [
            ['Budi Santoso', 'Kost Mawar Jl. Slamet Riyadi No.12, Kamar 5'],
            ['Rina Putri', 'Kost Melati Jl. Ahmad Yani No.45, Kamar 2 Lantai 1'],
            ['Agus Wijaya', 'Kost Barokah Jl. Veteran No.8, Kamar 10'],
            ['Sinta Dewi', 'Kost Amanah Jl. Honggowongso No.21, Kamar 3'],
            ['Doni Prasetyo', 'Kost Griya Asri Jl. Dr. Rajiman No.77, Kamar 7'],
            ['Maya Anggraini', 'Kost Sakinah Jl. Yos Sudarso No.33, Kamar 1'],
            ['Fajar Nugroho', 'Kost Pondok Aren Jl. Monginsidi No.54, Kamar 9'],
            ['Lina Marlina', 'Kost Cempaka Jl. Bhayangkara No.19, Kamar 4'],
            ['Rudi Hartono', 'Kost Sejahtera Jl. Kapten Mulyadi No.66, Kamar 6'],
            ['Nina Kurnia', 'Kost Berkah Jl. Gajah Mada No.88, Kamar 11'],
            ['Eko Saputra', 'Kost Damai Jl. Sutan Syahrir No.5, Kamar 8'],
            ['Fitri Handayani', 'Kost Flamboyan Jl. Sutarto No.41, Kamar 12'],
        ];

        // 12 completed tersebar 7 hari terakhir
        const completedPlan = [
            [6, [[4, 1]]], [6, [[2, 1], [4, 1]]], [5, [[1, 1]]], [5, [[3, 1]]],
            [4, [[5, 1], [4, 1]]], [3, [[4, 2]]], [3, [[6, 1]]], [2, [[1, 1], [2, 1]]],
            [1, [[3, 1], [4, 1]]], [1, [[2, 1]]], [0, [[4, 1], [6, 1]]], [0, [[5, 1]]],
        ];
        completedPlan.forEach(([daysAgo, items], i) => {
            const created = stampDaysAgo(daysAgo, 10 + (i % 8), 15);
            const [nm, alamat] = names[i % names.length];
            makeOrder({
                name: nm, alamat,
                usulan: addDays(dayOf(created), -1),
                fix: dayOf(created),
                status: 'completed',
                items, created,
            });
        });

        // 3 pending
        makeOrder({
            name: 'Galih Permana', alamat: 'Kost Kenanga Jl. Sam Ratulangi No.29, Kamar 2',
            usulan: addDays(todayStr(), 1), status: 'pending', items: [[1, 1]], created: stampHoursAgo(5),
        });
        makeOrder({
            name: 'Wulan Sari', alamat: 'Kost Dahlia Jl. Dr. Muwardi No.71, Kamar 6',
            usulan: addDays(todayStr(), 2), status: 'pending', items: [[3, 1], [4, 1]], created: stampHoursAgo(2),
        });
        makeOrder({
            name: 'Yoga Aditya', alamat: 'Kost Alamanda Jl. Kebangkitan Nasional No.14, Kamar 1',
            usulan: addDays(todayStr(), 3), status: 'pending', items: [[2, 1]], created: stampHoursAgo(1),
        });

        // 1 confirmed, 1 rescheduled, 1 cancelled
        makeOrder({
            name: 'Ratna Wijaya', alamat: 'Kost Anggrek Jl. Cut Nyak Dien No.9, Kamar 4',
            usulan: todayStr(), fix: addDays(todayStr(), 1), status: 'confirmed',
            items: [[1, 1], [6, 1]], created: stampHoursAgo(8), catatan: 'Sudah ACC via WA, kerjakan pagi.',
        });
        makeOrder({
            name: 'Hendra Gunawan', alamat: 'Kost Teratai Jl. Setiabudi No.60, Kamar 3',
            usulan: todayStr(), fix: addDays(todayStr(), 4), status: 'rescheduled',
            items: [[5, 1]], created: stampHoursAgo(10), catatan: 'Minta pindah karena keluar kota.',
        });
        makeOrder({
            name: 'Dian Puspita', alamat: 'Kost Kamboja Jl. Ir. Sutami No.23, Kamar 5',
            usulan: addDays(todayStr(), -1), status: 'cancelled',
            items: [[4, 1]], created: addDays(todayStr(), -1) + ' 09:20',
            alasan: 'Customer tiba-tiba pulang kampung, batal dulu.',
        });

        return {
            settings: {
                admin_wa_number: '6281234567890',
                operator_name: 'Syada Saleha',
                is_open: true,
                business_name: 'Bersihinkost',
                jam_mulai: '08:00',
                jam_selesai: '17:00',
                catatan_publik: 'Pemesanan untuk hari yang sama harap konfirmasi 2 jam sebelumnya.',
            },
            users: [{ id: 1, name: 'Syada Saleha', email: 'admin@kostclean.test', password: 'admin123' }],
            categories,
            services,
            orders,
            closures: [],
            counters: { service: services.length, category: categories.length, order: orders.length, closure: 0 },
        };
    }

    /* ------------------------------ persistence --------------------------- */
    let db = null;

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) {
                db = JSON.parse(raw);
                if (db && db.orders && db.services && db.settings) return;
            }
        } catch (e) { /* corrupt -> reseed */ }
        db = seed();
        save();
    }
    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(db)); }
        catch (e) {
            console.warn('Gagal menyimpan ke localStorage (penuh?)', e);
            if (global.UI && UI.toast) UI.toast('Penyimpanan browser penuh — perubahan tidak tersimpan.', 'err');
        }
    }
    function ensure() { if (!db) load(); return db; }

    /* ------------------------------- session ------------------------------ */
    function getSession() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
        catch (e) { return null; }
    }
    function setSession(s) {
        if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
        else localStorage.removeItem(SESSION_KEY);
    }

    /* -------------------------- aturan jadwal (mirip JadwalRules) --------- */
    function jamOperasionalError(jam) {
        const s = ensure().settings;
        if (typeof jam !== 'string' || jam < s.jam_mulai || jam > s.jam_selesai) {
            return `Jam pengerjaan hanya ${s.jam_mulai}–${s.jam_selesai} WIB.`;
        }
        return null;
    }
    function liburError(tgl) {
        const c = ensure().closures.find(x => x.tanggal === tgl);
        if (!c) return null;
        return c.keterangan
            ? `Tanggal ${fmtDateLong(tgl)} tutup (${c.keterangan}).`
            : `Tanggal ${fmtDateLong(tgl)} sedang libur/tutup.`;
    }
    function minTanggal() {
        const s = ensure().settings;
        return s.is_open ? todayStr() : addDays(todayStr(), 1);
    }

    /* --------------------------------- API -------------------------------- */
    const Store = {
        // --- constants
        STATUS, STATUS_INVOICE, MONTHS_ID, MONTHS_SHORT, DAYS_ID,

        // --- format helpers (dipakai view)
        fmtNumber, fmtRp, fmtDate, fmtDateLong, fmtDateTime, fmtDateTimeLong,
        weekdayLong, monthName, dayOf, timeOf, todayStr, addDays, nowStamp, ymd,

        // --- aturan jadwal (dipakai view)
        minTanggal, liburError, jamOperasionalError,

        // --- lifecycle
        load, save,
        resetDemo() {
            db = seed();
            save();
            setSession(null);
        },
        get db() { return ensure(); },

        // --- settings
        settings() { return ensure().settings; },
        updateSettings(patch) {
            Object.assign(ensure().settings, patch);
            save();
        },

        // --- auth
        currentUser() {
            const sess = getSession();
            if (!sess) return null;
            return ensure().users.find(u => u.id === sess.user_id) || null;
        },
        login(email, password, remember) {
            const u = ensure().users.find(x => x.email.toLowerCase() === String(email).toLowerCase());
            if (!u || u.password !== password) return { ok: false, message: 'Email atau password salah.' };
            setSession({ user_id: u.id, remember: !!remember, at: nowStamp() });
            return { ok: true, user: u };
        },
        logout() { setSession(null); },
        updateAccount({ name, email, password }, userId) {
            const users = ensure().users;
            const u = users.find(x => x.id === userId);
            if (!u) return { ok: false, message: 'Akun tidak ditemukan.' };
            if (!name || String(name).trim().length > 100) return { ok: false, message: 'Nama wajib diisi (maks 100 karakter).' };
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) return { ok: false, message: 'Email tidak valid.' };
            if (users.some(x => x.id !== u.id && x.email.toLowerCase() === email.toLowerCase())) {
                return { ok: false, message: 'Email sudah dipakai akun lain.' };
            }
            if (password && password.length < 8) return { ok: false, message: 'Kata sandi minimal 8 karakter.' };
            u.name = String(name).trim();
            u.email = email;
            if (password) u.password = password;
            save();
            return { ok: true };
        },

        // --- categories
        categories() { return ensure().categories.slice().sort((a, b) => a.name.localeCompare(b.name)); },
        addCategory(name) {
            name = String(name || '').trim();
            if (!name) return { ok: false, message: 'Nama kategori wajib diisi.' };
            if (name.length > 50) return { ok: false, message: 'Nama kategori maks 50 karakter.' };
            const cats = ensure().categories;
            if (cats.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                return { ok: false, message: 'Kategori sudah ada.' };
            }
            ensure().counters.category += 1;
            cats.push({ id: ensure().counters.category, name, created_at: nowStamp(), updated_at: nowStamp() });
            save();
            return { ok: true, message: `Kategori "${name}" ditambahkan.` };
        },
        renameCategory(oldName, newName) {
            newName = String(newName || '').trim();
            const cats = ensure().categories;
            const cat = cats.find(c => c.name === oldName);
            if (!cat) return { ok: false, message: 'Kategori tidak ditemukan.' };
            if (!newName || newName.length > 50) return { ok: false, message: 'Nama kategori wajib diisi (maks 50).' };
            if (newName === oldName) return { ok: false, message: 'Nama baru harus berbeda.' };
            if (cats.some(c => c.name.toLowerCase() === newName.toLowerCase())) return { ok: false, message: 'Kategori sudah ada.' };
            cat.name = newName;
            ensure().services.forEach(s => { if (s.category === oldName) s.category = newName; });
            save();
            return { ok: true, message: `Kategori "${oldName}" diubah menjadi "${newName}".` };
        },
        deleteCategory(name) {
            const cats = ensure().categories;
            if (ensure().services.some(s => s.category === name)) {
                return { ok: false, message: `Kategori "${name}" sedang digunakan layanan. Ubah atau hapus layanannya terlebih dahulu.` };
            }
            const i = cats.findIndex(c => c.name === name);
            if (i < 0) return { ok: false, message: 'Kategori tidak ditemukan.' };
            cats.splice(i, 1);
            save();
            return { ok: true, message: `Kategori "${name}" dihapus.` };
        },

        // --- services
        services(filter) {
            filter = filter || {};
            let list = ensure().services.slice().sort((a, b) => a.id - b.id);
            if (filter.category && filter.category !== 'all') list = list.filter(s => s.category === filter.category);
            if (filter.search) {
                const q = filter.search.toLowerCase();
                list = list.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
            }
            return list;
        },
        activeServices() { return ensure().services.filter(s => s.is_active).sort((a, b) => a.id - b.id); },
        service(id) { return ensure().services.find(s => s.id === Number(id)) || null; },
        validateService(data) {
            if (!data.name || !String(data.name).trim()) return 'Nama layanan wajib diisi.';
            if (String(data.name).length > 100) return 'Nama layanan maks 100 karakter.';
            if (!data.category) return 'Kategori wajib dipilih.';
            if (!ensure().categories.some(c => c.name === data.category)) return 'Kategori tidak ada.';
            const price = Number(data.price);
            if (!Number.isFinite(price) || price < 0) return 'Tarif tidak valid.';
            const dur = Number(data.duration_minutes);
            if (!Number.isFinite(dur) || dur < 5 || dur > 480) return 'Durasi harus 5–480 menit.';
            return null;
        },
        createService(data) {
            const err = this.validateService(data);
            if (err) return { ok: false, message: err };
            ensure().counters.service += 1;
            const now = nowStamp();
            ensure().services.push({
                id: ensure().counters.service,
                name: String(data.name).trim(),
                category: data.category,
                price: Math.round(Number(data.price)),
                duration_minutes: Math.round(Number(data.duration_minutes)),
                image_url: data.image_url || null,
                is_active: data.is_active !== false,
                created_at: now, updated_at: now,
            });
            save();
            return { ok: true, message: 'Layanan ditambahkan.' };
        },
        updateService(id, data) {
            const s = this.service(id);
            if (!s) return { ok: false, message: 'Layanan tidak ditemukan.' };
            const err = this.validateService(data);
            if (err) return { ok: false, message: err };
            s.name = String(data.name).trim();
            s.category = data.category;
            s.price = Math.round(Number(data.price));
            s.duration_minutes = Math.round(Number(data.duration_minutes));
            s.image_url = data.image_url || null;
            s.is_active = data.is_active !== false;
            s.updated_at = nowStamp();
            save();
            return { ok: true, message: 'Layanan diperbarui.' };
        },
        deleteService(id) {
            const dbx = ensure();
            const i = dbx.services.findIndex(s => s.id === Number(id));
            if (i < 0) return { ok: false, message: 'Layanan tidak ditemukan.' };
            const used = dbx.orders.some(o => o.items.some(it => it.service_id === Number(id)));
            if (used) {
                dbx.services[i].is_active = false;
                dbx.services[i].updated_at = nowStamp();
                save();
                return { ok: true, message: 'Layanan pernah dipesan, jadi dinonaktifkan (tidak dihapus).' };
            }
            dbx.services.splice(i, 1);
            save();
            return { ok: true, message: 'Layanan dihapus.' };
        },

        // --- closures (tanggal libur)
        closures() { return ensure().closures.slice().sort((a, b) => a.tanggal.localeCompare(b.tanggal)); },
        closedDatesFrom(dateStr) {
            return ensure().closures.filter(c => c.tanggal >= (dateStr || todayStr())).map(c => c.tanggal);
        },
        addClosure(tanggal, keterangan) {
            if (!tanggal) return { ok: false, message: 'Tanggal wajib diisi.' };
            if (tanggal < todayStr()) return { ok: false, message: 'Tanggal libur tidak boleh lampau.' };
            if (ensure().closures.some(c => c.tanggal === tanggal)) {
                return { ok: false, message: 'Tanggal tersebut sudah terdaftar sebagai libur.' };
            }
            ensure().counters.closure += 1;
            ensure().closures.push({
                id: ensure().counters.closure,
                tanggal,
                keterangan: String(keterangan || '').trim() || null,
                created_at: nowStamp(),
            });
            save();
            return { ok: true, message: 'Tanggal libur ditambahkan. Pemesan tidak bisa memilih tanggal tersebut.' };
        },
        deleteClosure(id) {
            const arr = ensure().closures;
            const i = arr.findIndex(c => c.id === Number(id));
            if (i < 0) return { ok: false, message: 'Data tidak ditemukan.' };
            arr.splice(i, 1);
            save();
            return { ok: true, message: 'Tanggal libur dihapus.' };
        },

        // --- orders
        orders() { return ensure().orders.slice(); },
        order(id) { return ensure().orders.find(o => o.id === Number(id)) || null; },
        nextOrderId() { return ensure().counters.order + 1; },

        createOrder({ customer_name, alamat, tanggal_usulan, jam_usulan, items, status, tanggal_fix, catatan_admin }) {
            const s = ensure().settings;
            if (!customer_name || !String(customer_name).trim()) return { ok: false, message: 'Nama pemesan wajib diisi.' };
            if (String(customer_name).length > 100) return { ok: false, message: 'Nama maks 100 karakter.' };
            if (!alamat || !String(alamat).trim()) return { ok: false, message: 'Alamat wajib diisi.' };
            if (String(alamat).length > 500) return { ok: false, message: 'Alamat maks 500 karakter.' };

            const st = status || 'pending';
            if (st === 'pending') {
                const min = minTanggal();
                if (!tanggal_usulan || tanggal_usulan < min) {
                    return { ok: false, message: s.is_open
                        ? 'Tanggal tersebut belum bisa dipilih.'
                        : 'Saat sedang tutup, pengerjaan paling cepat besok. Order tetap kami terima.' };
                }
            }
            const libur = liburError(tanggal_usulan);
            if (libur) return { ok: false, message: libur };
            const jamErr = jamOperasionalError(jam_usulan);
            if (jamErr) return { ok: false, message: jamErr };

            if (!Array.isArray(items) || !items.length) return { ok: false, message: 'Pilih minimal satu layanan.' };

            const rows = [];
            let total = 0, est = 0;
            for (const it of items) {
                const svc = this.service(it.service_id);
                if (!svc) return { ok: false, message: 'Layanan tidak ditemukan.' };
                if (!svc.is_active) return { ok: false, message: `Layanan ${svc.name} sedang nonaktif.` };
                const qty = Number(it.qty);
                if (!Number.isInteger(qty) || qty < 1 || qty > 20) return { ok: false, message: 'Jumlah layanan 1–20.' };
                const sub = svc.price * qty;
                total += sub;
                est += svc.duration_minutes * qty;
                rows.push({
                    service_id: svc.id, service_name: svc.name, qty,
                    harga_satuan: svc.price, subtotal: sub,
                });
            }

            const dbx = ensure();
            dbx.counters.order += 1;
            const now = nowStamp();
            const order = {
                id: dbx.counters.order,
                customer_name: String(customer_name).trim(),
                alamat: String(alamat).trim(),
                tanggal_usulan: tanggal_usulan + ' ' + jam_usulan,
                tanggal_fix: (tanggal_fix ? tanggal_fix + ' ' + jam_usulan : null),
                total_harga: total,
                estimasi_menit: est,
                status: st,
                alasan_batal: null,
                catatan_admin: catatan_admin || null,
                created_at: now,
                updated_at: now,
                items: rows,
            };
            dbx.orders.push(order);
            save();
            return { ok: true, order };
        },

        updateOrder(id, { customer_name, alamat, tanggal_usulan, jam_usulan, catatan_admin, items }) {
            const o = this.order(id);
            if (!o) return { ok: false, message: 'Pesanan tidak ditemukan.' };
            if (['cancelled', 'completed'].includes(o.status)) {
                return { ok: false, message: 'Pesanan yang sudah selesai/batal tidak bisa diubah.' };
            }
            if (!customer_name || !String(customer_name).trim()) return { ok: false, message: 'Nama pemesan wajib diisi.' };
            if (!alamat || !String(alamat).trim()) return { ok: false, message: 'Alamat wajib diisi.' };
            const libur = liburError(tanggal_usulan);
            if (libur) return { ok: false, message: libur };
            const jamErr = jamOperasionalError(jam_usulan);
            if (jamErr) return { ok: false, message: jamErr };
            if (!Array.isArray(items) || !items.length) return { ok: false, message: 'Pilih minimal satu layanan.' };

            const rows = [];
            let total = 0, est = 0;
            for (const it of items) {
                const svc = this.service(it.service_id);
                if (!svc) return { ok: false, message: 'Layanan tidak ditemukan.' };
                const qty = Number(it.qty);
                if (!Number.isInteger(qty) || qty < 1 || qty > 20) return { ok: false, message: 'Jumlah layanan 1–20.' };
                total += svc.price * qty;
                est += svc.duration_minutes * qty;
                rows.push({
                    service_id: svc.id, service_name: svc.name, qty,
                    harga_satuan: svc.price, subtotal: svc.price * qty,
                });
            }

            o.customer_name = String(customer_name).trim();
            o.alamat = String(alamat).trim();
            o.tanggal_usulan = tanggal_usulan + ' ' + jam_usulan;
            o.catatan_admin = catatan_admin || null;
            o.total_harga = total;
            o.estimasi_menit = est;
            o.items = rows;
            o.updated_at = nowStamp();
            save();
            return { ok: true, message: 'Pesanan berhasil diubah.', order: o };
        },

        accOrder(id, tanggal_fix, jam_fix) {
            const o = this.order(id);
            if (!o) return { ok: false, message: 'Pesanan tidak ditemukan.' };
            if (!tanggal_fix || tanggal_fix < todayStr()) return { ok: false, message: 'Tanggal fix tidak boleh lampau.' };
            const libur = liburError(tanggal_fix);
            if (libur) return { ok: false, message: libur };
            const jamErr = jamOperasionalError(jam_fix);
            if (jamErr) return { ok: false, message: jamErr };
            o.tanggal_fix = tanggal_fix + ' ' + jam_fix;
            o.status = 'confirmed';
            o.alasan_batal = null;
            o.updated_at = nowStamp();
            save();
            return { ok: true, message: `Order #${o.id} di-ACC untuk ${tanggal_fix} pukul ${jam_fix}.` };
        },

        rescheduleOrder(id, tanggal_fix, jam_fix) {
            const o = this.order(id);
            if (!o) return { ok: false, message: 'Pesanan tidak ditemukan.' };
            if (!tanggal_fix || tanggal_fix < todayStr()) return { ok: false, message: 'Tanggal baru tidak boleh lampau.' };
            const libur = liburError(tanggal_fix);
            if (libur) return { ok: false, message: libur };
            const jamErr = jamOperasionalError(jam_fix);
            if (jamErr) return { ok: false, message: jamErr };
            o.tanggal_fix = tanggal_fix + ' ' + jam_fix;
            o.status = 'rescheduled';
            o.updated_at = nowStamp();
            save();
            return { ok: true, message: `Order #${o.id} dipindah ke ${tanggal_fix} pukul ${jam_fix}.` };
        },

        cancelOrder(id, alasan) {
            const o = this.order(id);
            if (!o) return { ok: false, message: 'Pesanan tidak ditemukan.' };
            if (!alasan || !String(alasan).trim()) return { ok: false, message: 'Alasan batal wajib diisi.' };
            if (String(alasan).length > 500) return { ok: false, message: 'Alasan maks 500 karakter.' };
            o.status = 'cancelled';
            o.alasan_batal = String(alasan).trim();
            o.updated_at = nowStamp();
            save();
            return { ok: true, message: `Order #${o.id} dibatalkan.` };
        },

        completeOrder(id) {
            const o = this.order(id);
            if (!o) return { ok: false, message: 'Pesanan tidak ditemukan.' };
            o.status = 'completed';
            o.updated_at = nowStamp();
            save();
            return { ok: true, message: `Order #${o.id} selesai, masuk kas.` };
        },

        deleteOrder(id) {
            const dbx = ensure();
            const i = dbx.orders.findIndex(o => o.id === Number(id));
            if (i < 0) return { ok: false, message: 'Pesanan tidak ditemukan.' };
            if (dbx.orders[i].status !== 'cancelled') {
                return { ok: false, message: 'Hanya riwayat batal yang bisa dihapus.' };
            }
            dbx.orders.splice(i, 1);
            save();
            return { ok: true, message: `Riwayat order #${id} dihapus.` };
        },

        /** Filter & urut daftar pesanan (mirip OrderController@index) */
        queryOrders({ tab = 'all', search = '', sort = 'terbaru', bulan = 'all', tahun = 'all' } = {}) {
            const map = {
                'menunggu-acc': ['pending', 'rescheduled'],
                'terjadwal': ['confirmed'],
                'selesai': ['completed'],
                'batal': ['cancelled'],
                'menunggu': ['pending', 'rescheduled'],
                'proses': ['confirmed'],
            };
            let list = this.orders();
            if (map[tab]) list = list.filter(o => map[tab].includes(o.status));

            if (search) {
                const q = String(search).toLowerCase();
                list = list.filter(o =>
                    o.customer_name.toLowerCase().includes(q) || o.alamat.toLowerCase().includes(q));
            }

            const effDate = (o) => dayOf(o.tanggal_fix || o.tanggal_usulan);
            if (bulan !== 'all') list = list.filter(o => Number(effDate(o).slice(5, 7)) === Number(bulan));
            if (tahun !== 'all') list = list.filter(o => Number(effDate(o).slice(0, 4)) === Number(tahun));

            const cmpStr = (a, b) => String(a).localeCompare(String(b));
            switch (sort) {
                case 'terlama': list.sort((a, b) => cmpStr(a.created_at, b.created_at) || a.id - b.id); break;
                case 'id_asc': list.sort((a, b) => a.id - b.id); break;
                case 'id_desc': list.sort((a, b) => b.id - a.id); break;
                case 'nama_asc': list.sort((a, b) => cmpStr(a.customer_name, b.customer_name) || a.id - b.id); break;
                case 'nama_desc': list.sort((a, b) => cmpStr(b.customer_name, a.customer_name) || a.id - b.id); break;
                case 'usulan_asc': list.sort((a, b) => cmpStr(a.tanggal_usulan, b.tanggal_usulan) || a.id - b.id); break;
                case 'usulan_desc': list.sort((a, b) => cmpStr(b.tanggal_usulan, a.tanggal_usulan) || a.id - b.id); break;
                case 'fix_asc': list.sort((a, b) => cmpStr(a.tanggal_fix || a.tanggal_usulan, b.tanggal_fix || b.tanggal_usulan) || a.id - b.id); break;
                case 'fix_desc': list.sort((a, b) => cmpStr(b.tanggal_fix || b.tanggal_usulan, a.tanggal_fix || a.tanggal_usulan) || a.id - b.id); break;
                default: list.sort((a, b) => cmpStr(b.created_at, a.created_at) || b.id - a.id);
            }

            const counts = {
                all: this.orders().length,
                'menunggu-acc': this.orders().filter(o => ['pending', 'rescheduled'].includes(o.status)).length,
                terjadwal: this.orders().filter(o => o.status === 'confirmed').length,
                selesai: this.orders().filter(o => o.status === 'completed').length,
                batal: this.orders().filter(o => o.status === 'cancelled').length,
            };

            const years = [...new Set(this.orders().flatMap(o => [
                Number(dayOf(o.tanggal_usulan).slice(0, 4)),
                o.tanggal_fix ? Number(dayOf(o.tanggal_fix).slice(0, 4)) : null,
            ]).filter(Boolean))].sort((a, b) => a - b);
            if (!years.length) years.push(new Date().getFullYear());

            return { list, counts, years };
        },

        /** Validasi gabungan untuk form pesanan */
        validateJadwal(tanggal, jam, { allowPast = false } = {}) {
            if (!tanggal) return 'Tanggal wajib diisi.';
            if (!allowPast && tanggal < minTanggal()) {
                return ensure().settings.is_open
                    ? 'Tanggal tersebut belum bisa dipilih.'
                    : 'Saat sedang tutup, pengerjaan paling cepat besok. Order tetap kami terima.';
            }
            return liburError(tanggal) || jamOperasionalError(jam);
        },

        /** Ringkasan dashboard */
        dashboardStats() {
            const orders = this.orders();
            const now = new Date();
            const m = now.getMonth() + 1, y = now.getFullYear();
            const pending = orders.filter(o => ['pending', 'rescheduled'].includes(o.status));
            const completedThisMonth = orders.filter(o =>
                o.status === 'completed' &&
                Number(dayOf(o.updated_at).slice(5, 7)) === m &&
                Number(dayOf(o.updated_at).slice(0, 4)) === y);
            const createdThisMonth = orders.filter(o =>
                Number(dayOf(o.created_at).slice(5, 7)) === m &&
                Number(dayOf(o.created_at).slice(0, 4)) === y);
            const today = todayStr();
            const jadwalHariIni = orders.filter(o =>
                o.status !== 'cancelled' && dayOf(o.tanggal_fix || o.tanggal_usulan) === today).length;

            return {
                pendingCount: pending.length,
                pendingTotal: pending.reduce((a, b) => a + b.total_harga, 0),
                pendingOrders: pending.slice().sort((a, b) => b.id - a.id).slice(0, 10),
                kasBulanIni: completedThisMonth.reduce((a, b) => a + b.total_harga, 0),
                selesaiBulanIni: completedThisMonth.length,
                totalPesananBulanIni: createdThisMonth.length,
                jadwalHariIni,
            };
        },

        /** Laporan pemasukan (mirip OrderController@laporanDownload) */
        laporan({ search = '', bulan = 'all', tahun = 'all' } = {}) {
            let rows = this.orders().filter(o => o.status === 'completed');
            if (search) {
                const q = String(search).toLowerCase();
                rows = rows.filter(o =>
                    o.customer_name.toLowerCase().includes(q) || o.alamat.toLowerCase().includes(q));
            }
            if (bulan !== 'all') rows = rows.filter(o => Number(dayOf(o.updated_at).slice(5, 7)) === Number(bulan));
            if (tahun !== 'all') rows = rows.filter(o => Number(dayOf(o.updated_at).slice(0, 4)) === Number(tahun));
            rows.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));

            const totalPeriode = rows.reduce((a, b) => a + b.total_harga, 0);
            const totalKeseluruhan = this.orders()
                .filter(o => o.status === 'completed')
                .reduce((a, b) => a + b.total_harga, 0);

            const now = new Date();
            const yearForDays = tahun === 'all' ? now.getFullYear() : Number(tahun);
            let days;
            if (bulan !== 'all') {
                days = new Date(yearForDays, Number(bulan), 0).getDate();
            } else if (tahun !== 'all') {
                days = (yearForDays % 4 === 0 && yearForDays % 100 !== 0) || yearForDays % 400 === 0 ? 366 : 365;
            } else {
                const stamps = rows.map(r => r.updated_at).sort();
                if (stamps.length) {
                    const a = new Date(stamps[0].slice(0, 10));
                    const b = new Date(stamps[stamps.length - 1].slice(0, 10));
                    days = Math.max(1, Math.round((b - a) / 86400000) + 1);
                } else days = 1;
            }
            const rataHarian = days > 0 ? Math.round(totalPeriode / days) : 0;

            const periodeLabel =
                (bulan === 'all' ? 'Semua Bulan' : monthName(Number(bulan))) + ' ' +
                (tahun === 'all' ? 'Semua Tahun' : tahun);

            return { rows, totalPeriode, totalKeseluruhan, rataHarian, days, periodeLabel };
        },

        /** Link WhatsApp (mirip WaComposer) */
        waLink(order) {
            const s = ensure().settings;
            const lines = [];
            lines.push('Halo Kak ' + s.operator_name + ', saya ingin memesan jasa bersih kost:');
            lines.push('');
            lines.push('*Order #' + order.id + ' - Menunggu Konfirmasi*');
            lines.push('Nama: ' + order.customer_name);
            lines.push('Alamat: ' + order.alamat);
            lines.push('Tanggal Usulan: ' + dayOf(order.tanggal_usulan).split('-').reverse().join('/') + ' ' + timeOf(order.tanggal_usulan) + ' WIB');
            lines.push('');
            lines.push('*Detail Layanan:*');
            order.items.forEach(it => {
                lines.push('- ' + it.service_name + ' (' + it.qty + 'x) - Rp' + fmtNumber(it.subtotal));
            });
            lines.push('');
            lines.push('*Total Biaya:* Rp' + fmtNumber(order.total_harga));
            lines.push('Estimasi: ' + order.estimasi_menit + ' Menit');
            lines.push('');
            lines.push('Mohon konfirmasi jadwalnya ya kak. Terima kasih!');
            return 'https://wa.me/' + s.admin_wa_number + '?text=' + encodeURIComponent(lines.join('\n'));
        },
    };

    global.Store = Store;
    load();

})(window);
