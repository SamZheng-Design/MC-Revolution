import type { FC } from 'hono/jsx'

// =====================================================
// 评估通 — 独立登录页
// 
// 设计对标 MC-Revolution v33：
//   - 深色 indigo/purple 渐变背景
//   - 精致玻璃态卡片
//   - 流畅入场动画
//   - 专业金融科技质感
// =====================================================

export const LoginPage: FC = () => {
  return (
    <div class="login-root min-h-screen relative overflow-hidden" style="background: linear-gradient(135deg, #0f0b2e 0%, #1a1145 30%, #1e1b4b 60%, #0c0a20 100%);">
      
      {/* ── 全局样式 ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap');

        .login-root {
          font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* ── 背景动效 ── */
        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
          animation: orbFloat 12s ease-in-out infinite;
        }
        .bg-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #6366f1 0%, transparent 70%);
          top: -100px; left: -100px;
          animation-delay: 0s;
        }
        .bg-orb-2 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
          bottom: -150px; right: -100px;
          animation-delay: -4s;
        }
        .bg-orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #a78bfa 0%, transparent 70%);
          top: 40%; left: 60%;
          animation-delay: -8s;
          opacity: 0.12;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }

        /* ── 网格背景 ── */
        .grid-bg {
          position: absolute; inset: 0;
          background-image: 
            linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(ellipse at 50% 50%, black 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at 50% 50%, black 30%, transparent 75%);
        }

        /* ── 登录卡片 ── */
        .login-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-radius: 24px;
          box-shadow: 
            0 25px 60px rgba(0,0,0,0.4),
            0 0 0 1px rgba(99,102,241,0.06),
            inset 0 1px 0 rgba(255,255,255,0.06);
          animation: cardEntry 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }
        @keyframes cardEntry {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── 标题动画 ── */
        .title-animate {
          animation: titleSlide 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
          opacity: 0;
        }
        @keyframes titleSlide {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── 输入框 ── */
        .login-input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: #e2e8f0;
          font-size: 15px;
          transition: all 0.3s ease;
          outline: none;
        }
        .login-input::placeholder {
          color: rgba(148,163,184,0.5);
        }
        .login-input:focus {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.06);
          box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
        }
        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(148,163,184,0.4);
          font-size: 16px;
          transition: color 0.3s;
        }
        .input-group:focus-within .input-icon {
          color: #818cf8;
        }

        /* ── 主按钮 ── */
        .btn-login {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          font-weight: 700;
          font-size: 15px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(99,102,241,0.35);
        }
        .btn-login:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(99,102,241,0.45);
        }
        .btn-login:active {
          transform: translateY(0);
        }
        .btn-login::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        .btn-login:hover::after {
          transform: translateX(100%);
        }
        .btn-login:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* ── checkbox ── */
        .custom-checkbox {
          appearance: none;
          width: 16px; height: 16px;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 4px;
          background: rgba(255,255,255,0.04);
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .custom-checkbox:checked {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: #6366f1;
        }
        .custom-checkbox:checked::after {
          content: '✓';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 10px;
          font-weight: bold;
        }

        /* ── 社交登录按钮 ── */
        .social-btn {
          flex: 1;
          padding: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: rgba(226,232,240,0.7);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .social-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
          color: #e2e8f0;
        }

        /* ── Logo 脉冲 ── */
        .logo-pulse {
          animation: logoPulse 3s ease-in-out infinite;
        }
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
        }

        /* ── 粒子效果 ── */
        .particle {
          position: absolute;
          width: 3px; height: 3px;
          background: rgba(99,102,241,0.4);
          border-radius: 50%;
          pointer-events: none;
        }
        .particle:nth-child(1) { top: 15%; left: 10%; animation: particleDrift 8s infinite; }
        .particle:nth-child(2) { top: 25%; right: 15%; animation: particleDrift 12s infinite 2s; width: 2px; height: 2px; }
        .particle:nth-child(3) { bottom: 20%; left: 20%; animation: particleDrift 10s infinite 4s; }
        .particle:nth-child(4) { top: 60%; right: 10%; animation: particleDrift 9s infinite 1s; width: 4px; height: 4px; background: rgba(139,92,246,0.3); }
        .particle:nth-child(5) { bottom: 30%; left: 50%; animation: particleDrift 11s infinite 3s; width: 2px; height: 2px; }
        .particle:nth-child(6) { top: 10%; left: 65%; animation: particleDrift 14s infinite 5s; background: rgba(167,139,250,0.3); }
        @keyframes particleDrift {
          0%, 100% { transform: translate(0, 0); opacity: 0.6; }
          25% { transform: translate(15px, -20px); opacity: 1; }
          50% { transform: translate(-10px, 10px); opacity: 0.4; }
          75% { transform: translate(20px, 5px); opacity: 0.8; }
        }

        /* ── 底部链接 ── */
        .footer-link {
          color: rgba(148,163,184,0.4);
          text-decoration: none;
          font-size: 12px;
          transition: color 0.2s;
        }
        .footer-link:hover {
          color: rgba(148,163,184,0.7);
        }

        /* ── Toast ── */
        .login-toast {
          position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          z-index: 9999;
          animation: toastIn 0.3s ease-out;
          display: flex; align-items: center; gap: 8px;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* ── Loading spinner ── */
        @keyframes spin { to { transform: rotate(360deg); } }
        .fa-spin { animation: spin 1s linear infinite; }

        /* ── 分割线 ── */
        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
      `}</style>

      {/* ── 背景层 ── */}
      <div class="bg-orb bg-orb-1"></div>
      <div class="bg-orb bg-orb-2"></div>
      <div class="bg-orb bg-orb-3"></div>
      <div class="grid-bg"></div>
      
      {/* ── 粒子 ── */}
      <div class="particle"></div>
      <div class="particle"></div>
      <div class="particle"></div>
      <div class="particle"></div>
      <div class="particle"></div>
      <div class="particle"></div>

      {/* ── Toast 容器 ── */}
      <div id="login-toast"></div>

      {/* ── 主内容 ── */}
      <div class="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">

        {/* ── 顶部品牌 ── */}
        <div class="title-animate text-center mb-8">
          <div class="inline-flex items-center gap-3 mb-6">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center logo-pulse shadow-lg shadow-indigo-500/25">
              <i class="fas fa-clipboard-check text-white text-2xl"></i>
            </div>
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Assess Connect
          </h1>
          <p class="text-indigo-300/60 text-sm font-medium tracking-wide">
            评估通 · 多智能体协作投资决策平台
          </p>
        </div>

        {/* ── 登录卡片 ── */}
        <div class="login-card w-full max-w-md p-8 sm:p-10">
          
          {/* 欢迎语 */}
          <div class="mb-8">
            <h2 class="text-xl font-bold text-white mb-1.5">欢迎回来</h2>
            <p class="text-sm text-slate-400">登录您的账户以访问评估系统</p>
          </div>

          {/* 登录表单 */}
          <form id="loginForm" onsubmit="handleLogin(event)" autocomplete="off">
            
            {/* 邮箱 */}
            <div class="input-group relative mb-4">
              <i class="fas fa-envelope input-icon"></i>
              <input type="email" id="loginEmail" class="login-input" 
                placeholder="邮箱地址" required autocomplete="email" />
            </div>

            {/* 密码 */}
            <div class="input-group relative mb-4">
              <i class="fas fa-lock input-icon"></i>
              <input type="password" id="loginPassword" class="login-input" 
                placeholder="登录密码" required autocomplete="current-password" />
              <button type="button" onclick="togglePasswordVisibility()" 
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition" tabindex="-1">
                <i id="eyeIcon" class="fas fa-eye text-sm"></i>
              </button>
            </div>

            {/* 记住 & 忘记密码 */}
            <div class="flex items-center justify-between mb-6">
              <label class="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" class="custom-checkbox" checked />
                <span class="text-sm text-slate-400">记住登录</span>
              </label>
              <a href="javascript:void(0)" class="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition no-underline">
                忘记密码？
              </a>
            </div>

            {/* 登录按钮 */}
            <button type="submit" id="btnLogin" class="btn-login">
              <i class="fas fa-arrow-right-to-bracket"></i>
              <span>登录</span>
            </button>
          </form>

          {/* 分割线 */}
          <div class="flex items-center gap-4 my-6">
            <div class="divider-line"></div>
            <span class="text-xs text-slate-500 font-medium whitespace-nowrap">或使用其他方式</span>
            <div class="divider-line"></div>
          </div>

          {/* 社交登录 */}
          <div class="flex gap-3">
            <button onclick="socialLogin('wechat')" class="social-btn">
              <i class="fab fa-weixin text-green-400"></i>
              <span>微信</span>
            </button>
            <button onclick="socialLogin('dingtalk')" class="social-btn">
              <i class="fas fa-comment-dots text-blue-400"></i>
              <span>钉钉</span>
            </button>
            <button onclick="socialLogin('sso')" class="social-btn">
              <i class="fas fa-building text-purple-400"></i>
              <span>企业SSO</span>
            </button>
          </div>

          {/* 注册提示 */}
          <div class="mt-8 text-center">
            <p class="text-sm text-slate-500">
              还没有账户？
              <a href="javascript:void(0)" onclick="showRegisterHint()" class="text-indigo-400 hover:text-indigo-300 font-semibold transition no-underline ml-1">
                申请试用
              </a>
            </p>
          </div>
        </div>

        {/* ── 底部信息 ── */}
        <div class="title-animate mt-8 flex items-center gap-4 text-center" style="animation-delay: 0.5s;">
          <a href="javascript:void(0)" class="footer-link">使用条款</a>
          <span class="text-slate-700">·</span>
          <a href="javascript:void(0)" class="footer-link">隐私政策</a>
          <span class="text-slate-700">·</span>
          <a href="javascript:void(0)" class="footer-link">帮助中心</a>
        </div>

        <p class="title-animate mt-4 text-[11px] text-slate-600" style="animation-delay: 0.6s;">
          &copy; 2026 Micro Connect · Assess Connect v2.0
        </p>
      </div>

      {/* ── 登录逻辑 ── */}
      <script dangerouslySetInnerHTML={{ __html: `
        // 密码可见性切换
        function togglePasswordVisibility() {
          const pwd = document.getElementById('loginPassword');
          const icon = document.getElementById('eyeIcon');
          if (pwd.type === 'password') {
            pwd.type = 'text';
            icon.className = 'fas fa-eye-slash text-sm';
          } else {
            pwd.type = 'password';
            icon.className = 'fas fa-eye text-sm';
          }
        }

        // 登录处理
        function handleLogin(e) {
          e.preventDefault();
          const email = document.getElementById('loginEmail').value.trim();
          const password = document.getElementById('loginPassword').value;
          const btn = document.getElementById('btnLogin');
          
          if (!email || !password) {
            showLoginToast('请填写邮箱和密码', 'error');
            return;
          }

          // 按钮loading态
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i><span>验证中...</span>';

          // 模拟验证动画（实际可对接身份通API）
          setTimeout(() => {
            // Demo模式：任意邮箱+密码均可登录
            showLoginToast('登录成功，正在跳转...', 'success');
            
            // 保存登录状态
            sessionStorage.setItem('assess_auth', JSON.stringify({
              email: email,
              name: email.split('@')[0],
              role: 'investor',
              loginTime: new Date().toISOString()
            }));

            // 跳转到评估通主界面
            setTimeout(() => {
              window.location.href = '/assess';
            }, 800);
          }, 1500);
        }

        // 社交登录
        function socialLogin(provider) {
          const names = { wechat: '微信', dingtalk: '钉钉', sso: '企业SSO' };
          showLoginToast(names[provider] + ' 登录功能即将上线', 'info');
        }

        // 注册提示
        function showRegisterHint() {
          showLoginToast('请联系管理员获取试用账号', 'info');
        }

        // Toast
        function showLoginToast(msg, type) {
          const container = document.getElementById('login-toast');
          const colors = {
            success: 'background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.2);',
            error:   'background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.2);',
            info:    'background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.2);'
          };
          const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
          container.innerHTML = '<div class="login-toast" style="' + (colors[type] || colors.info) + '">' +
            '<i class="fas ' + (icons[type] || icons.info) + '"></i>' + msg + '</div>';
          setTimeout(() => container.innerHTML = '', 3000);
        }

        // 快捷键：Enter 提交
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && document.activeElement?.closest('#loginForm')) {
            document.getElementById('loginForm').dispatchEvent(new Event('submit'));
          }
        });

        // 页面加载时检查已有登录
        (function checkAuth() {
          const auth = sessionStorage.getItem('assess_auth');
          if (auth) {
            try {
              const data = JSON.parse(auth);
              // 已登录，直接跳转
              window.location.href = '/assess';
            } catch(e) {}
          }
        })();
      `}} />
    </div>
  )
}
