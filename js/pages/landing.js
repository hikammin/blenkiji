const Pages = window.Pages || {};
Pages._landingMode = Pages._landingMode || 'login';

Pages.Landing = () => {
  window.toggleMode = () => {
    const scrollY = window.scrollY;
    Pages._landingMode = Pages._landingMode === 'login' ? 'register' : 'login';
    Pages.Landing();
    window.scrollTo(0, scrollY);
  };

  window.togglePassword = (id) => {
    const input = document.getElementById(id);
    if (input.type === 'password') {
      input.type = 'text';
    } else {
      input.type = 'password';
    }
  };

  window.handleAuth = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (Pages._landingMode === 'register') {
      const tosAgreed = document.getElementById('tos-agree').checked;
      if (!tosAgreed) {
        Utils.showAlert('新規登録するには利用規約に同意する必要があります。');
        return;
      }
    }

    const success = await Auth.login(email, password, Pages._landingMode);
    if (success) {
      window.location.hash = '/home';
    }
  };

  const articles = DB.getArticles();
  const featuredArticles = articles.filter(a => a.isFeatured && a.isPublic).slice(0, 3);

  const renderFeatured = () => {
    if (featuredArticles.length === 0) return '<p class="text-center text-muted">現在おすすめの記事はありません。</p>';
    return `
      <div class="grid md:grid-cols-3 mb-8">
        ${featuredArticles.map(a => Components.ArticleCard(a)).join('')}
      </div>
    `;
  };

  let formContent = '';
  if (Pages._landingMode === 'login') {
    formContent = `
      <h2 class="text-center mb-4">ログイン</h2>
      <div class="form-group">
        <label class="form-label" for="login-email">メールアドレス</label>
        <input type="email" id="login-email" class="form-control" placeholder="your@email.com" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="login-password">パスワード</label>
        <div style="position: relative;">
          <input type="password" id="login-password" class="form-control" placeholder="パスワードを入力" required>
          <button type="button" onclick="togglePassword('login-password')" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.2rem;" title="パスワードを表示">👁️</button>
        </div>
      </div>
      <div style="text-align: center; margin-top: 1rem;">
        <button type="submit" class="btn btn-primary" style="padding: 0.8rem 3rem; font-size: 1.1rem;">ログイン</button>
      </div>
      <div class="text-center mt-2">
        <a href="#/forgot-password" style="font-size: 0.85rem; color: var(--primary-light);">パスワードを忘れた場合</a>
      </div>
      <div class="text-center mt-4 pt-4" style="border-top: 1px solid var(--border-color);">
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;">アカウントをお持ちでないですか？</p>
        <a href="javascript:void(0)" onclick="toggleMode()" class="btn btn-outline w-100" style="display: block; text-decoration: none;">新規登録はこちら</a>
      </div>
    `;
  } else {
    formContent = `
      <h2 class="text-center mb-4">新規登録</h2>
      <div class="form-group">
        <label class="form-label" for="login-email">メールアドレス</label>
        <input type="email" id="login-email" class="form-control" placeholder="your@email.com" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="login-password">パスワード</label>
        <div style="position: relative;">
          <input type="password" id="login-password" class="form-control" placeholder="大文字を含む英数字6文字以上" required minlength="6">
          <button type="button" onclick="togglePassword('login-password')" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.2rem;" title="パスワードを表示">👁️</button>
        </div>
        <small style="color: var(--text-muted); display: block; margin-top: 0.5rem;">※「英語・数字のみ（記号不可）」かつ「大文字を最低1つ」含めてください。</small>
      </div>
      <div class="form-group" style="display: flex; align-items: flex-start; gap: 0.5rem; margin-top: 1.5rem; margin-bottom: 1.5rem; padding: 1rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); border-radius: var(--radius);">
        <input type="checkbox" id="tos-agree" required style="margin-top: 0.3rem; transform: scale(1.2); cursor: pointer;">
        <label for="tos-agree" style="font-size: 0.9rem; color: var(--text-main); cursor: pointer; line-height: 1.4;">
          <a href="#/tos" style="color: #0066cc; text-decoration: underline;" target="_blank">利用規約</a>の内容に同意します。
        </label>
      </div>
      <button type="submit" class="btn btn-primary w-100">新規登録してはじめる</button>
      <div class="text-center mt-4 pt-4" style="border-top: 1px solid var(--border-color);">
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;">すでにアカウントをお持ちですか？</p>
        <a href="javascript:void(0)" onclick="toggleMode()" class="btn btn-outline w-100" style="display: block; text-decoration: none;">ログイン画面に戻る</a>
      </div>
    `;
  }

  const html = `
    ${Components.Navbar()}
    <main class="main-content">
      <div class="container">
        <div class="hero">
          <h1>Blender記事市場</h1>
          <p>Blenderユーザーたちが製作工程を記事形式で共有し、学習出来るコミュニティプラットフォームです。記事を読んだり、自分のノウハウを共有しましょう！</p>
        </div>
        
        <div class="mb-8">
          <h2 class="text-center mb-4" style="font-size: 1.8rem; color: var(--primary-dark);">🔥 おすすめの記事</h2>
          <p class="text-center mb-8" style="color: var(--text-muted);">※記事を読むにはログイン・新規登録が必要です</p>
          ${renderFeatured()}
        </div>

        <div class="card" id="login-section" style="max-width: 450px; margin: 0 auto; padding: 2rem;">
          <form onsubmit="handleAuth(event)">
            ${formContent}
          </form>
        </div>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
};
