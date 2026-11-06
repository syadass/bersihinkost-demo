/* =============================================================================
 * Bersihinkost DEMO — Auth: Login, Lupa Sandi, Reset Sandi
 * Catatan: email tidak benar-benar dikirim; tautan reset ditampilkan langsung.
 * ========================================================================== */
(function (global) {
    'use strict';

    const { esc } = UI;

    // token reset disimpan sementara di localStorage
    const RESET_KEY = 'bersihinkost_demo_reset';

    function authShell(iconClass, iconTone, title, subtitle, body) {
        return `
        <div class="min-h-screen flex flex-col selection:bg-peach-400 selection:text-white">
            <div class="flex-1 w-full flex items-center justify-center p-4 relative overflow-hidden">
                <div class="absolute -top-20 -left-20 w-72 h-72 bg-lavender-200 rounded-full blur-3xl opacity-50"></div>
                <div class="absolute -bottom-20 -right-20 w-72 h-72 bg-peach-200 rounded-full blur-3xl opacity-50"></div>

                <main class="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-float border border-lavender-50 p-5 sm:p-10 relative z-10 flex flex-col items-center">
                    <div class="w-16 h-16 ${iconTone} rounded-3xl flex items-center justify-center text-white shadow-lg mb-5">
                        <i class="fa-solid ${iconClass} text-2xl"></i>
                    </div>
                    <h1 class="text-2xl font-extrabold text-gray-800 tracking-tight text-center">${title}</h1>
                    <p class="text-xs font-bold text-lavender-500 mt-1 mb-8 text-center">${subtitle}</p>
                    ${body}
                </main>
            </div>
        </div>`;
    }

    function renderLogin(query) {
        const setting = Store.settings();
        const notice = query.ok ? `<div class="w-full mb-4 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold px-4 py-3 rounded-2xl">${esc(query.ok)}</div>` : '';
        return {
            title: 'Login Pengelola - Bersihinkost',
            html: authShell('fa-broom', 'bg-gradient-to-tr from-lavender-600 to-lavender-700',
                `${esc(setting.business_name)} Manager`, 'Masuk ke panel pengelolaan mandiri', `
                ${notice}
                <div id="loginError" class="hidden w-full mb-4 bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl"></div>

                <form id="loginForm" class="w-full space-y-4">
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1.5">Email Pengelola</label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400"><i class="fa-solid fa-envelope text-xs"></i></span>
                            <input type="email" name="email" required placeholder="nama@bersihinkost.com" class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1.5">Kata Sandi</label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400"><i class="fa-solid fa-lock text-xs"></i></span>
                            <input type="password" id="password" name="password" required placeholder="••••••••" class="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
                            <button type="button" id="togglePw" title="Tampilkan sandi" class="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-lavender-600 transition-colors">
                                <i class="fa-solid fa-eye text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center justify-between text-xs font-bold py-1">
                        <label class="flex items-center gap-2 cursor-pointer text-gray-600">
                            <input type="checkbox" name="remember" value="1" checked class="rounded accent-lavender-600 w-4 h-4"> Ingat Saya
                        </label>
                        <a href="#/lupa-sandi" class="text-lavender-600 hover:underline">Lupa sandi?</a>
                    </div>
                    <button type="submit" class="w-full py-4 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-lg shadow-lavender-200 hover:bg-lavender-700 hover:shadow-xl transition-all flex justify-center items-center gap-2 mt-2">
                        <i class="fa-solid fa-right-to-bracket"></i> Masuk Dashboard
                    </button>
                </form>

                <div class="w-full mt-4 bg-lavender-50 border border-lavender-100 rounded-2xl px-4 py-3 text-[11px] font-bold text-lavender-700">
                    <i class="fa-solid fa-flask mr-1"></i> DEMO — akun: <b>admin@kostclean.test</b> / sandi: <b>admin123</b>
                </div>

                <div class="mt-8 pt-6 border-t border-gray-100 w-full text-center">
                    <a href="#/" class="text-xs font-extrabold text-gray-400 hover:text-lavender-600 transition-colors flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-arrow-left text-[10px]"></i> Kembali ke Web Publik (Pemesan)
                    </a>
                </div>`),
            init() {
                document.getElementById('togglePw').onclick = (e) => {
                    const input = document.getElementById('password');
                    const show = input.type === 'password';
                    input.type = show ? 'text' : 'password';
                    e.currentTarget.innerHTML = `<i class="fa-solid ${show ? 'fa-eye-slash' : 'fa-eye'} text-xs"></i>`;
                };
                document.getElementById('loginForm').onsubmit = (e) => {
                    e.preventDefault();
                    const email = e.target.email.value.trim();
                    const password = e.target.password.value;
                    const remember = e.target.remember.checked;
                    const res = Store.login(email, password, remember);
                    const box = document.getElementById('loginError');
                    if (!res.ok) {
                        box.textContent = res.message;
                        box.classList.remove('hidden');
                        return;
                    }
                    location.hash = '#/admin';
                };
            },
        };
    }

    function renderForgot() {
        return {
            title: 'Lupa Kata Sandi - Bersihinkost',
            html: authShell('fa-key', 'bg-gradient-to-tr from-peach-400 to-peach-500',
                'Lupa Kata Sandi?', 'Masukkan email akun — tautan reset ditampilkan langsung (demo)', `
                <div id="forgotMsg" class="hidden w-full mb-4 text-xs font-bold px-4 py-3 rounded-2xl"></div>

                <form id="forgotForm" class="w-full space-y-4">
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1.5">Email Akun</label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400"><i class="fa-solid fa-envelope text-xs"></i></span>
                            <input type="email" name="email" required placeholder="nama@bersihinkost.com" class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
                        </div>
                    </div>
                    <button type="submit" class="w-full py-4 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-lg shadow-lavender-200 hover:bg-lavender-700 hover:shadow-xl transition-all flex justify-center items-center gap-2 mt-2">
                        <i class="fa-solid fa-paper-plane"></i> Kirim Tautan Reset
                    </button>
                </form>

                <div class="mt-8 pt-6 border-t border-gray-100 w-full text-center">
                    <a href="#/login" class="text-xs font-extrabold text-gray-400 hover:text-lavender-600 transition-colors flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-arrow-left text-[10px]"></i> Kembali ke Login
                    </a>
                </div>`),
            init() {
                document.getElementById('forgotForm').onsubmit = (e) => {
                    e.preventDefault();
                    const email = e.target.email.value.trim();
                    const box = document.getElementById('forgotMsg');
                    const user = Store.db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
                    if (!user) {
                        box.className = 'w-full mb-4 bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl';
                        box.textContent = 'Email tidak terdaftar.';
                        box.classList.remove('hidden');
                        return;
                    }
                    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
                    try { localStorage.setItem(RESET_KEY, JSON.stringify({ token, email, at: Date.now() })); } catch (err) { /* noop */ }
                    box.className = 'w-full mb-4 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold px-4 py-3 rounded-2xl';
                    box.innerHTML = `Tautan reset dibuat (demo — email tidak dikirim):<br>
                        <a class="underline text-lavender-600 break-all" href="#/reset-sandi/${token}?email=${encodeURIComponent(email)}">Klik di sini untuk buat sandi baru</a>`;
                    box.classList.remove('hidden');
                };
            },
        };
    }

    function renderReset(params, query) {
        let stored = null;
        try { stored = JSON.parse(localStorage.getItem(RESET_KEY) || 'null'); } catch (e) { /* noop */ }
        const tokenOk = stored && stored.token === params.token;

        if (!tokenOk) {
            return {
                title: 'Reset Kata Sandi - Bersihinkost',
                html: authShell('fa-lock-open', 'bg-gradient-to-tr from-emerald-400 to-emerald-500',
                    'Tautan Tidak Valid', 'Sesi reset sudah kedaluwarsa atau tautan salah.', `
                    <a href="#/lupa-sandi" class="block w-full py-4 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-lg hover:bg-lavender-700 transition-all text-center">Minta Tautan Baru</a>
                    <div class="mt-8 pt-6 border-t border-gray-100 w-full text-center">
                        <a href="#/login" class="text-xs font-extrabold text-gray-400 hover:text-lavender-600 flex items-center justify-center gap-1.5">
                            <i class="fa-solid fa-arrow-left text-[10px]"></i> Kembali ke Login
                        </a>
                    </div>`),
            };
        }

        const email = query.email || stored.email;
        return {
            title: 'Reset Kata Sandi - Bersihinkost',
            html: authShell('fa-lock-open', 'bg-gradient-to-tr from-emerald-400 to-emerald-500',
                'Buat Sandi Baru', 'Minimal 8 karakter — jangan pakai sandi lama', `
                <div id="resetError" class="hidden w-full mb-4 bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl"></div>
                <form id="resetForm" class="w-full space-y-4">
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1.5">Email Akun</label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400"><i class="fa-solid fa-envelope text-xs"></i></span>
                            <input type="email" name="email" value="${esc(email)}" required class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1.5">Kata Sandi Baru</label>
                        <input type="password" name="password" required minlength="8" placeholder="••••••••" class="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1.5">Ulangi Sandi Baru</label>
                        <input type="password" name="password_confirmation" required minlength="8" placeholder="••••••••" class="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
                    </div>
                    <button type="submit" class="w-full py-4 rounded-2xl bg-emerald-500 text-white font-extrabold text-sm shadow-lg hover:bg-emerald-600 hover:shadow-xl transition-all flex justify-center items-center gap-2 mt-2">
                        <i class="fa-solid fa-check"></i> Simpan Sandi Baru
                    </button>
                </form>
                <div class="mt-8 pt-6 border-t border-gray-100 w-full text-center">
                    <a href="#/login" class="text-xs font-extrabold text-gray-400 hover:text-lavender-600 flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-arrow-left text-[10px]"></i> Kembali ke Login
                    </a>
                </div>`),
            init() {
                document.getElementById('resetForm').onsubmit = (e) => {
                    e.preventDefault();
                    const emailVal = e.target.email.value.trim();
                    const pw = e.target.password.value;
                    const pw2 = e.target.password_confirmation.value;
                    const box = document.getElementById('resetError');
                    const fail = (m) => { box.textContent = m; box.classList.remove('hidden'); };
                    if (pw.length < 8) return fail('Kata sandi minimal 8 karakter.');
                    if (pw !== pw2) return fail('Ulangi kata sandi tidak sama.');
                    const user = Store.db.users.find(u => u.email.toLowerCase() === emailVal.toLowerCase());
                    if (!user) return fail('Email tidak terdaftar.');
                    user.password = pw;
                    Store.save();
                    try { localStorage.removeItem(RESET_KEY); } catch (err) { /* noop */ }
                    location.hash = '#/login?ok=' + encodeURIComponent('Kata sandi berhasil diubah. Silakan login.');
                };
            },
        };
    }

    global.PagesAuth = { renderLogin, renderForgot, renderReset };
})(window);
