/* =============================================================================
 * Bersihinkost DEMO — Dashboard Admin (stat, chart, kalender, order masuk)
 * ========================================================================== */
(function (global) {
    'use strict';

    const { esc, fmtRp } = { esc: UI.esc, fmtRp: Store.fmtRp };
    let activeCharts = [];

    function destroyCharts() {
        activeCharts.forEach(c => { try { c.destroy(); } catch (e) { /* noop */ } });
        activeCharts = [];
    }

    function renderDashboard(query) {
        const setting = Store.settings();
        const user = Store.currentUser();
        const stats = Store.dashboardStats();
        const orders = Store.orders();

        // --- bulan kalender
        let month;
        try {
            const [y, m] = (query.bulan || Store.ymd(new Date()).slice(0, 7)).split('-').map(Number);
            month = new Date(y, m - 1, 1);
            if (isNaN(month.getTime())) month = new Date();
        } catch (e) { month = new Date(); }

        // --- filter chart
        const years = [...new Set(orders.map(o => Number(Store.dayOf(o.created_at).slice(0, 4))))];
        const thisYear = new Date().getFullYear();
        if (!years.includes(thisYear)) years.push(thisYear);
        years.sort((a, b) => a - b);

        let chartBulan = Number(query.g_bulan || new Date().getMonth() + 1);
        if (!(chartBulan >= 1 && chartBulan <= 12)) chartBulan = new Date().getMonth() + 1;
        let chartTahun = Number(query.g_tahun || thisYear);
        if (!years.includes(chartTahun)) chartTahun = thisYear;

        let pieBulan = query.pie_bulan === 'all' ? 'all' : Number(query.pie_bulan || new Date().getMonth() + 1);
        if (pieBulan !== 'all' && !(pieBulan >= 1 && pieBulan <= 12)) pieBulan = new Date().getMonth() + 1;
        let pieTahun = Number(query.pie_tahun || thisYear);
        if (!years.includes(pieTahun)) pieTahun = thisYear;

        // --- grid kalender (Sen..Min)
        const gridStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const dayOfWeek = (gridStart.getDay() + 6) % 7; // Senin = 0
        gridStart.setDate(gridStart.getDate() - dayOfWeek);
        const gridEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        gridEnd.setDate(gridEnd.getDate() + ((7 - ((gridEnd.getDay() + 6) % 7)) % 7));

        const effDay = (o) => Store.dayOf(o.tanggal_fix || o.tanggal_usulan);
        const byDate = {};
        orders.forEach(o => {
            const d = effDay(o);
            if (d >= Store.ymd(gridStart) && d <= Store.ymd(gridEnd)) (byDate[d] = byDate[d] || []).push(o);
        });

        const weeks = [];
        const cursor = new Date(gridStart);
        const today = Store.todayStr();
        while (cursor <= gridEnd) {
            const dateStr = Store.ymd(cursor);
            const weekDay = {
                date: dateStr,
                dayNum: String(cursor.getDate()).padStart(2, '0'),
                inMonth: cursor.getMonth() === month.getMonth(),
                isToday: dateStr === today,
                orders: byDate[dateStr] || [],
            };
            const wi = weeks.length ? weeks.length - 1 : 0;
            if (!weeks.length || weeks[weeks.length - 1].length === 7) weeks.push([weekDay]);
            else weeks[weeks.length - 1].push(weekDay);
            cursor.setDate(cursor.getDate() + 1);
            void wi;
        }

        // --- tren harian (order masuk per tanggal pada bulan+tahun pilihan)
        const daysInMonth = new Date(chartTahun, chartBulan, 0).getDate();
        const trendLabels = [], trendValues = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const ds = `${chartTahun}-${String(chartBulan).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            trendLabels.push(String(d));
            trendValues.push(orders.filter(o => Store.dayOf(o.created_at) === ds).length);
        }
        const trendTotalPesanan = orders.filter(o => {
            const d = Store.dayOf(o.created_at);
            return Number(d.slice(5, 7)) === chartBulan && Number(d.slice(0, 4)) === chartTahun;
        }).length;
        const trendTotalPenghasilan = orders.filter(o => {
            if (o.status !== 'completed') return false;
            const d = Store.dayOf(o.updated_at);
            return Number(d.slice(5, 7)) === chartBulan && Number(d.slice(0, 4)) === chartTahun;
        }).reduce((a, b) => a + b.total_harga, 0);
        const trendRataHarian = Math.round(trendTotalPenghasilan / daysInMonth);

        // --- pie perbandingan layanan (qty, filter created_at)
        const pieMap = {};
        orders.forEach(o => {
            const d = Store.dayOf(o.created_at);
            if (Number(d.slice(0, 4)) !== pieTahun) return;
            if (pieBulan !== 'all' && Number(d.slice(5, 7)) !== pieBulan) return;
            o.items.forEach(it => { pieMap[it.service_name] = (pieMap[it.service_name] || 0) + it.qty; });
        });
        const palette = ['#7c3aed', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#a855f7', '#84cc16', '#f97316'];
        const pieRows = Object.entries(pieMap).sort((a, b) => b[1] - a[1]);
        const pieTotal = pieRows.reduce((a, b) => a + b[1], 0);
        const pieData = pieRows.map(([label, qty], i) => ({
            label, qty, color: palette[i % palette.length],
            pct: pieTotal ? Math.round(qty / pieTotal * 1000) / 10 : 0,
        }));

        // --- chip kalendar
        const chipCls = {
            pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-emerald-100 text-emerald-600',
            rescheduled: 'bg-blue-100 text-blue-600', completed: 'bg-lavender-100 text-lavender-600',
            cancelled: 'bg-red-100 text-red-400 line-through',
        };
        const dotCls = { pending: 'bg-amber-400', confirmed: 'bg-emerald-400', rescheduled: 'bg-blue-400', completed: 'bg-lavender-400', cancelled: 'bg-red-400' };

        const monthName = Store.MONTHS_ID[month.getMonth()];
        const nowDate = new Date();
        const hariIni = `${Store.DAYS_ID[nowDate.getDay()]}, ${String(nowDate.getDate()).padStart(2, '0')} ${Store.MONTHS_SHORT[nowDate.getMonth()]} ${nowDate.getFullYear()}`;

        const content = `
        <header class="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pt-2 shrink-0 gap-3">
            <div>
                <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Bersihinkost Dashboard</h1>
                <p class="text-sm font-bold text-lavender-500">${esc(hariIni)}</p>
            </div>
            <div class="flex items-center gap-3 sm:gap-4">
                <div class="relative flex-1 sm:flex-none sm:w-64 md:w-72">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400"><i class="fa-solid fa-magnifying-glass"></i></span>
                    <input type="text" id="searchInput" placeholder="Cari nama atau alamat..." class="w-full pl-12 pr-4 py-3.5 rounded-3xl bg-white border-none shadow-card text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
                </div>
                <div class="hidden sm:flex items-center gap-3 bg-white pl-3 pr-5 py-2 rounded-full shadow-card cursor-pointer hover:bg-lavender-50 transition-colors border border-lavender-100 shrink-0">
                    <div class="w-10 h-10 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center font-extrabold border-2 border-white shadow-sm">${esc(UI.initials(user.name))}</div>
                    <div>
                        <p class="text-sm font-extrabold text-gray-800 leading-tight">${esc(user.name)}</p>
                        <p class="text-[10px] font-extrabold text-peach-500 uppercase tracking-wider">Solo Operator</p>
                    </div>
                </div>
            </div>
        </header>

        <div class="flex-1 overflow-y-auto pb-6 pr-1 sm:pr-2 min-h-0 space-y-5">
            <!-- 1. Stat Cards -->
            <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                <div class="bg-gradient-to-br from-peach-400 to-peach-500 rounded-3xl shadow-card p-4 sm:p-5 text-white relative overflow-hidden">
                    <div class="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                    <div class="flex items-center gap-2 mb-1.5">
                        <span class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><i class="fa-solid fa-wallet text-sm"></i></span>
                        <h3 class="text-[11px] sm:text-xs font-bold text-white/85 leading-tight">Pendapatan Bulan Ini</h3>
                    </div>
                    <p class="text-lg sm:text-2xl font-extrabold truncate">Rp${Store.fmtNumber(stats.kasBulanIni)}</p>
                    <p class="text-[11px] sm:text-xs font-semibold text-white/90 mt-1"><i class="fa-solid fa-circle-check mr-1"></i>${stats.selesaiBulanIni} kamar selesai</p>
                </div>
                <div class="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50">
                    <div class="flex items-center gap-2 mb-1.5">
                        <span class="w-8 h-8 rounded-xl bg-lavender-50 text-lavender-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-clipboard-list text-sm"></i></span>
                        <h3 class="text-[11px] sm:text-xs font-bold text-gray-500 leading-tight">Total Pesanan Bulan Ini</h3>
                    </div>
                    <p class="text-lg sm:text-2xl font-extrabold text-gray-800">${stats.totalPesananBulanIni} <span class="text-xs font-bold text-gray-400">pesanan</span></p>
                    <p class="text-[11px] sm:text-xs font-semibold text-gray-400 mt-1">${Store.MONTHS_ID[nowDate.getMonth()]} ${nowDate.getFullYear()}</p>
                </div>
                <a href="#/admin/pesanan?tab=menunggu-acc" class="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-amber-100 hover:shadow-lg transition-shadow block">
                    <div class="flex items-center gap-2 mb-1.5">
                        <span class="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-clock text-sm"></i></span>
                        <h3 class="text-[11px] sm:text-xs font-bold text-gray-500 leading-tight">Menunggu Persetujuan</h3>
                    </div>
                    <p class="text-lg sm:text-2xl font-extrabold text-gray-800">${stats.pendingCount} <span class="text-xs font-bold text-gray-400">order</span></p>
                    <p class="text-[11px] sm:text-xs font-bold text-amber-600 mt-1">Rp${Store.fmtNumber(stats.pendingTotal)} →</p>
                </a>
                <a href="#kalender" class="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50 hover:shadow-lg transition-shadow block">
                    <div class="flex items-center gap-2 mb-1.5">
                        <span class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-calendar-day text-sm"></i></span>
                        <h3 class="text-[11px] sm:text-xs font-bold text-gray-500 leading-tight">Jadwal Hari Ini</h3>
                    </div>
                    <p class="text-lg sm:text-2xl font-extrabold text-gray-800">${stats.jadwalHariIni} <span class="text-xs font-bold text-gray-400">jadwal</span></p>
                    <p class="text-[11px] sm:text-xs font-semibold text-gray-400 mt-1">${String(nowDate.getDate()).padStart(2, '0')} ${Store.MONTHS_SHORT[nowDate.getMonth()]} ${nowDate.getFullYear()}</p>
                </a>
            </div>

            <!-- 2. Charts -->
            <div class="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-5">
                <div class="xl:col-span-3 bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50 min-w-0">
                    <div class="flex flex-wrap justify-between items-center gap-2 mb-3">
                        <h3 class="text-sm font-extrabold text-gray-800">Tren Pemesan Bulanan</h3>
                        <div class="flex items-center gap-2">
                            <select id="gBulan" class="px-3 py-2 rounded-full bg-gray-50 border border-gray-200 text-xs font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer">
                                ${Store.MONTHS_ID.map((m, i) => `<option value="${i + 1}" ${chartBulan === i + 1 ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                            <select id="gTahun" class="px-3 py-2 rounded-full bg-gray-50 border border-gray-200 text-xs font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer">
                                ${years.map(y => `<option value="${y}" ${chartTahun === y ? 'selected' : ''}>${y}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="h-52 sm:h-60 w-full"><canvas id="trendChart"></canvas></div>
                    <p class="text-[11px] font-semibold text-gray-400 mt-2">Jumlah order masuk per hari · ${Store.MONTHS_ID[chartBulan - 1]} ${chartTahun}</p>
                    <div class="grid grid-cols-3 gap-2 sm:gap-3 mt-3">
                        <div class="rounded-2xl bg-emerald-50/70 border border-emerald-100 px-3 py-2.5 flex items-center gap-2.5 min-w-0">
                            <span class="w-8 h-8 rounded-xl bg-emerald-500 text-white hidden sm:flex items-center justify-center shrink-0"><i class="fa-solid fa-wallet text-xs"></i></span>
                            <div class="min-w-0">
                                <p class="text-[10px] font-bold text-emerald-600 leading-tight">Total Penghasilan</p>
                                <p class="text-[13px] sm:text-sm font-extrabold text-gray-800 truncate">Rp${Store.fmtNumber(trendTotalPenghasilan)}</p>
                            </div>
                        </div>
                        <div class="rounded-2xl bg-lavender-50/70 border border-lavender-100 px-3 py-2.5 flex items-center gap-2.5 min-w-0">
                            <span class="w-8 h-8 rounded-xl bg-lavender-600 text-white hidden sm:flex items-center justify-center shrink-0"><i class="fa-solid fa-clipboard-list text-xs"></i></span>
                            <div class="min-w-0">
                                <p class="text-[10px] font-bold text-lavender-500 leading-tight">Total Pesanan</p>
                                <p class="text-[13px] sm:text-sm font-extrabold text-gray-800 truncate">${trendTotalPesanan} <span class="text-[10px] font-bold text-gray-400">pesanan</span></p>
                            </div>
                        </div>
                        <div class="rounded-2xl bg-peach-50/70 border border-peach-100 px-3 py-2.5 flex items-center gap-2.5 min-w-0">
                            <span class="w-8 h-8 rounded-xl bg-peach-500 text-white hidden sm:flex items-center justify-center shrink-0"><i class="fa-solid fa-calendar-day text-xs"></i></span>
                            <div class="min-w-0">
                                <p class="text-[10px] font-bold text-peach-600 leading-tight">Rata-rata / Hari</p>
                                <p class="text-[13px] sm:text-sm font-extrabold text-gray-800 truncate">Rp${Store.fmtNumber(trendRataHarian)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="xl:col-span-2 bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50 min-w-0 flex flex-col">
                    <div class="flex items-center justify-between gap-2 mb-3 shrink-0">
                        <h3 class="text-[13px] sm:text-sm font-extrabold text-gray-800 whitespace-nowrap shrink-0">Perbandingan Layanan</h3>
                        <div class="flex items-center gap-1.5 min-w-0">
                            <select id="pieBulan" class="min-w-0 px-2 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-[11px] font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer">
                                <option value="all" ${pieBulan === 'all' ? 'selected' : ''}>Semua</option>
                                ${Store.MONTHS_ID.map((m, i) => `<option value="${i + 1}" ${pieBulan === i + 1 ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                            <select id="pieTahun" class="px-2 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-[11px] font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer">
                                ${years.map(y => `<option value="${y}" ${pieTahun === y ? 'selected' : ''}>${y}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    ${pieTotal > 0 ? `
                        <div class="h-40 sm:h-44 w-full flex justify-center shrink-0"><canvas id="pieChart"></canvas></div>
                        <ul class="mt-2 flex-1 grid grid-cols-2 gap-x-3 content-evenly overflow-y-auto pr-1">
                            ${pieData.map(p => `
                                <li class="flex items-center gap-2 text-xs font-bold text-gray-600">
                                    <span class="w-3 h-3 rounded-full shrink-0" style="background:${p.color}"></span>
                                    <span class="flex-1 truncate" title="${esc(p.label)}">${esc(p.label)}</span>
                                </li>`).join('')}
                        </ul>` : `
                        <div class="h-44 flex flex-col items-center justify-center text-center text-gray-400">
                            <i class="fa-solid fa-chart-pie text-3xl mb-2 text-lavender-200"></i>
                            <p class="text-xs font-bold">Belum ada data pesanan pada periode ini</p>
                        </div>`}
                </div>
            </div>

            <!-- 3. Kalender -->
            <div id="kalender" class="bg-white rounded-3xl shadow-card border border-lavender-50 p-4 sm:p-5 scroll-mt-4">
                <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
                    <h3 class="font-extrabold text-gray-800 text-sm sm:text-base">Kalender Jadwal</h3>
                    <div class="flex items-center gap-2">
                        <button id="prevMonth" class="w-9 h-9 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center hover:bg-lavender-100"><i class="fa-solid fa-chevron-left text-xs"></i></button>
                        <div class="relative">
                            <button id="monthJumpBtn" class="px-4 py-2 rounded-full bg-lavender-600 text-white text-xs font-extrabold hover:bg-lavender-700 flex items-center gap-2 shadow">
                                ${monthName} ${month.getFullYear()} <i class="fa-solid fa-caret-down text-[10px]"></i>
                            </button>
                            <div id="monthJump" class="hidden absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-float border border-lavender-100 p-4 z-30">
                                <div class="flex items-center justify-between mb-3">
                                    <button id="jumpPrevYear" class="w-8 h-8 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center hover:bg-lavender-100"><i class="fa-solid fa-chevron-left text-[10px]"></i></button>
                                    <span id="jumpYearLabel" class="text-sm font-extrabold text-gray-800"></span>
                                    <button id="jumpNextYear" class="w-8 h-8 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center hover:bg-lavender-100"><i class="fa-solid fa-chevron-right text-[10px]"></i></button>
                                </div>
                                <div id="jumpMonthGrid" class="grid grid-cols-3 gap-2"></div>
                                <button id="jumpToday" class="w-full mt-3 py-2 rounded-xl bg-lavender-50 text-lavender-600 text-xs font-extrabold hover:bg-lavender-100">Kembali ke bulan ini</button>
                            </div>
                        </div>
                        <button id="nextMonth" class="w-9 h-9 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center hover:bg-lavender-100"><i class="fa-solid fa-chevron-right text-xs"></i></button>
                    </div>
                </div>
                <div class="flex flex-wrap gap-3 mb-4 text-[11px] font-extrabold">
                    ${[['pending', 'Menunggu ACC'], ['confirmed', 'Confirmed'], ['rescheduled', 'Reschedule'], ['completed', 'Selesai'], ['cancelled', 'Batal']]
                        .map(([k, v]) => `<span class="flex items-center gap-1.5 text-gray-500"><span class="w-2.5 h-2.5 rounded-full ${dotCls[k]}"></span>${v}</span>`).join('')}
                </div>
                <div class="grid grid-cols-7 gap-1 sm:gap-2">
                    ${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
                        .map(d => `<div class="text-center text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-lavender-400 pb-1">${d}</div>`).join('')}
                    ${weeks.map(week => week.map(day => `
                        <div class="rounded-xl sm:rounded-2xl border p-1 sm:p-2 min-h-[64px] sm:min-h-[92px] ${day.isToday
                            ? 'border-lavender-400 ring-2 ring-lavender-200 bg-lavender-50/50'
                            : 'border-gray-100 bg-gray-50/50'} ${day.inMonth ? '' : 'opacity-40'}">
                            <p class="text-[11px] sm:text-xs font-extrabold ${day.isToday ? 'text-lavender-600' : 'text-gray-500'} mb-1">${day.dayNum}</p>
                            <div class="space-y-1 hidden sm:block">
                                ${day.orders.slice(0, 3).map(o => `
                                    <a href="#/admin/pesanan/${o.id}?from=dashboard" title="#${o.id} • ${esc(o.customer_name)} • ${esc(Store.fmtDateTime(o.tanggal_fix || o.tanggal_usulan))} • Rp${Store.fmtNumber(o.total_harga)}"
                                        class="block truncate text-[10px] font-extrabold px-2 py-0.5 rounded-full ${chipCls[o.status] || 'bg-gray-100 text-gray-500'}">${esc(o.customer_name)}</a>`).join('')}
                                ${day.orders.length > 3 ? `<p class="text-[10px] font-bold text-gray-400 pl-2">+${day.orders.length - 3} lagi</p>` : ''}
                            </div>
                            ${day.orders.length ? `
                                <div class="sm:hidden flex gap-0.5 flex-wrap">
                                    ${day.orders.slice(0, 4).map(o => `<span class="w-1.5 h-1.5 rounded-full ${dotCls[o.status] || 'bg-gray-300'}"></span>`).join('')}
                                </div>` : ''}
                        </div>`).join('')).join('')}
                </div>
            </div>
        </div>`;

        const pendingHtml = stats.pendingOrders.length ? stats.pendingOrders.map(o => `
            <div class="bg-white p-3 rounded-2xl shadow-sm border border-amber-100">
                <div class="flex justify-between items-start gap-2">
                    <div class="min-w-0">
                        <h4 class="text-sm font-extrabold text-gray-800 leading-tight">#${o.id} • ${esc(o.customer_name)}</h4>
                        <p class="text-[11px] font-bold text-gray-400 mt-0.5 truncate">${esc(o.alamat)}</p>
                        <p class="text-[11px] font-bold text-gray-400"><i class="fa-regular fa-calendar mr-1"></i>Usulan: ${esc(Store.fmtDateTime(o.tanggal_usulan))}</p>
                        <p class="text-[11px] font-semibold text-gray-400 truncate">${esc(o.items.map(i => i.service_name + ' (' + i.qty + 'x)').join(', '))}</p>
                    </div>
                    <span class="text-xs font-extrabold text-peach-500 whitespace-nowrap">Rp${Store.fmtNumber(o.total_harga)}</span>
                </div>
                <div class="flex flex-col gap-2 mt-3">
                    <form class="acc-quick flex flex-col min-[420px]:flex-row gap-1.5 min-[420px]:items-center bg-emerald-50 rounded-2xl p-1.5" data-id="${o.id}">
                        <input type="date" name="tanggal_fix" value="${Store.dayOf(o.tanggal_fix || o.tanggal_usulan)}" class="flex-1 min-w-0 text-[11px] font-bold bg-white rounded-full px-2 py-1.5 border border-emerald-200 focus:outline-none">
                        <div class="flex gap-1.5">
                            <input type="time" name="jam_fix" min="${esc(setting.jam_mulai)}" max="${esc(setting.jam_selesai)}" value="${Store.timeOf(o.tanggal_fix || o.tanggal_usulan)}" class="flex-1 min-[420px]:w-[76px] min-w-0 text-[11px] font-bold bg-white rounded-full px-2 py-1.5 border border-emerald-200 focus:outline-none">
                            <button class="flex-1 min-[420px]:flex-none px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-extrabold hover:bg-emerald-600 whitespace-nowrap"><i class="fa-solid fa-check mr-1"></i>ACC</button>
                        </div>
                    </form>
                    <a href="#/admin/pesanan/${o.id}?from=dashboard" class="w-full min-[420px]:w-9 min-[420px]:h-9 py-2 min-[420px]:py-0 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center gap-1 hover:bg-lavender-100 shrink-0 text-[11px] min-[420px]:text-xs font-extrabold" title="Detail"><i class="fa-solid fa-chevron-right text-xs"></i><span class="min-[420px]:hidden">Lihat Detail</span></a>
                </div>
            </div>`).join('') : `
            <div class="h-full flex flex-col items-center justify-center text-center opacity-70 py-10">
                <div class="w-24 h-24 rounded-full bg-emerald-50 text-emerald-300 flex items-center justify-center text-4xl mb-4 border-2 border-dashed border-emerald-200">
                    <i class="fa-solid fa-circle-check"></i>
                </div>
                <p class="text-lg font-extrabold text-gray-700">Tidak ada order menunggu</p>
                <p class="text-sm font-semibold text-gray-400 mt-1">Semua jadwal sudah terkonfirmasi</p>
            </div>`;

        const right = `
        <aside class="w-full xl:w-[380px] shrink-0 bg-white rounded-[2rem] xl:rounded-[2.5rem] shadow-float flex flex-col z-10 overflow-hidden border border-lavender-50 lg:max-h-full">
            <div class="px-6 sm:px-7 pt-6 sm:pt-7 pb-4 bg-white">
                <div class="flex justify-between items-center mb-2">
                    <h2 class="text-xl sm:text-2xl font-extrabold text-gray-800"> Pesanan Masuk</h2>
                    <a href="#/admin/pesanan?tab=menunggu-acc" class="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center hover:bg-amber-200 transition-colors font-extrabold text-sm" title="Lihat semua menunggu ACC">${stats.pendingCount}</a>
                </div>
                <div class="flex flex-wrap gap-2">
                    <span class="bg-amber-100 text-amber-600 text-xs font-bold px-3 py-1 rounded-full">${stats.pendingCount} Menunggu ACC</span>
                    <span class="bg-peach-100 text-peach-600 text-xs font-bold px-3 py-1 rounded-full">Rp${Store.fmtNumber(stats.pendingTotal)}</span>
                </div>
            </div>
            <div class="xl:flex-1 xl:overflow-y-auto xl:min-h-0 max-h-[60vh] xl:max-h-none overflow-y-auto px-4 sm:px-5 py-2 space-y-3 sm:space-y-4">
                ${pendingHtml}
            </div>
            <div class="p-5 sm:p-6 bg-gray-50/50 border-t border-gray-100 rounded-t-[2rem]">
                <div class="flex justify-between items-center text-sm font-bold text-gray-500 mb-4">
                    <span>Order Menunggu ACC</span>
                    <span>${stats.pendingCount} order</span>
                </div>
                <a href="#/admin/pesanan" class="w-full py-3.5 sm:py-4 rounded-3xl bg-lavender-600 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-lavender-200 hover:bg-lavender-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex justify-center items-center gap-3">
                    <i class="fa-solid fa-calendar-check"></i> Kelola Semua Pesanan
                </a>
            </div>
        </aside>`;

        return {
            title: 'Bersihinkost Dashboard',
            layout: () => AdminLayout.adminLayout('dashboard', content, right),
            init() {
                // charts
                if (typeof Chart !== 'undefined') {
                    Chart.defaults.font.family = "'Nunito', sans-serif";
                    const trendCtx = document.getElementById('trendChart');
                    if (trendCtx) {
                        activeCharts.push(new Chart(trendCtx.getContext('2d'), {
                            type: 'line',
                            data: {
                                labels: trendLabels,
                                datasets: [{
                                    label: 'Order masuk', data: trendValues,
                                    borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                    borderWidth: 3, fill: true, tension: 0.4,
                                    pointBackgroundColor: '#ffffff', pointBorderColor: '#8b5cf6',
                                    pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 6,
                                }],
                            },
                            options: {
                                responsive: true, maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#9ca3af', maxTicksLimit: 12 } },
                                    y: { beginAtZero: true, ticks: { font: { size: 10, weight: 'bold' }, color: '#9ca3af', precision: 0 }, grid: { color: '#f3f4f6' } },
                                },
                            },
                        }));
                    }
                    const pieCtx = document.getElementById('pieChart');
                    if (pieCtx && pieTotal > 0) {
                        activeCharts.push(new Chart(pieCtx.getContext('2d'), {
                            type: 'pie',
                            data: {
                                labels: pieData.map(p => p.label),
                                datasets: [{
                                    data: pieData.map(p => p.qty),
                                    backgroundColor: pieData.map(p => p.color),
                                    borderColor: '#ffffff', borderWidth: 3, hoverOffset: 8,
                                }],
                            },
                            options: {
                                responsive: true, maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            label: (ctx) => {
                                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                                const pct = total ? (ctx.parsed / total * 100).toFixed(1) : 0;
                                                return ' ' + ctx.label + ': ' + ctx.parsed + 'x (' + pct + '%)';
                                            },
                                        },
                                    },
                                },
                            },
                        }));
                    }
                }

                // search -> ke daftar pesanan
                document.getElementById('searchInput')?.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && e.target.value.trim() !== '') {
                        location.hash = '#/admin/pesanan?search=' + encodeURIComponent(e.target.value.trim());
                    }
                });

                // filter chart
                const goChart = () => {
                    const p = new URLSearchParams();
                    if (query.bulan) p.set('bulan', query.bulan);
                    p.set('g_bulan', document.getElementById('gBulan').value);
                    p.set('g_tahun', document.getElementById('gTahun').value);
                    p.set('pie_bulan', document.getElementById('pieBulan').value);
                    p.set('pie_tahun', document.getElementById('pieTahun').value);
                    location.hash = '#/admin?' + p.toString();
                };
                ['gBulan', 'gTahun', 'pieBulan', 'pieTahun'].forEach(id => {
                    document.getElementById(id)?.addEventListener('change', goChart);
                });

                // navigasi kalender
                const setMonth = (y, m) => {
                    const p = new URLSearchParams();
                    Object.entries(query).forEach(([k, v]) => { if (k !== 'bulan') p.set(k, v); });
                    p.set('bulan', `${y}-${String(m).padStart(2, '0')}`);
                    location.hash = '#/admin?' + p.toString();
                };
                document.getElementById('prevMonth').onclick = () => setMonth(month.getFullYear(), month.getMonth() === 0 ? 12 : month.getMonth());
                document.getElementById('nextMonth').onclick = () => setMonth(month.getFullYear(), month.getMonth() === 11 ? 1 : month.getMonth() + 2);

                // jump bulan
                let jumpYear = month.getFullYear();
                const shownYear = month.getFullYear(), shownMonth = month.getMonth() + 1;
                const jumpBox = document.getElementById('monthJump');
                const renderJump = () => {
                    document.getElementById('jumpYearLabel').innerText = jumpYear;
                    const g = document.getElementById('jumpMonthGrid');
                    g.innerHTML = '';
                    Store.MONTHS_ID.forEach((nm, idx) => {
                        const m = idx + 1;
                        const b = document.createElement('button');
                        const active = (jumpYear === shownYear && m === shownMonth);
                        b.className = 'py-2 rounded-xl text-xs font-extrabold ' + (active ? 'bg-lavender-600 text-white shadow' : 'bg-gray-50 text-gray-600 hover:bg-lavender-50 hover:text-lavender-600');
                        b.textContent = nm;
                        b.onclick = () => setMonth(jumpYear, m);
                        g.appendChild(b);
                    });
                };
                document.getElementById('monthJumpBtn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    jumpBox.classList.toggle('hidden');
                    renderJump();
                });
                document.getElementById('jumpPrevYear').addEventListener('click', (e) => { e.stopPropagation(); jumpYear--; renderJump(); });
                document.getElementById('jumpNextYear').addEventListener('click', (e) => { e.stopPropagation(); jumpYear++; renderJump(); });
                document.getElementById('jumpToday').addEventListener('click', () => {
                    const p = new URLSearchParams();
                    Object.entries(query).forEach(([k, v]) => { if (k !== 'bulan') p.set(k, v); });
                    location.hash = '#/admin' + (p.toString() ? '?' + p.toString() : '');
                });
                document.addEventListener('click', (e) => {
                    if (!jumpBox.classList.contains('hidden') && !jumpBox.contains(e.target)) jumpBox.classList.add('hidden');
                });

                // ACC cepat dari panel kanan
                document.querySelectorAll('form.acc-quick').forEach(f => {
                    f.onsubmit = (e) => {
                        e.preventDefault();
                        const id = Number(f.dataset.id);
                        const tgl = f.tanggal_fix.value, jam = f.jam_fix.value;
                        const res = Store.accOrder(id, tgl, jam);
                        if (!res.ok) return UI.toast(res.message, 'err');
                        UI.toast(res.message);
                        App.render();
                    };
                });
            },
            destroy: destroyCharts,
        };
    }

    global.PagesDashboard = { renderDashboard, destroyCharts };
})(window);
