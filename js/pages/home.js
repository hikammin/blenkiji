window.Pages = window.Pages || {};

Pages.Home = () => {
  const articles = DB.getArticles().filter(a => a.isPublic);
  const featuredArticles = articles.filter(a => a.isFeatured);
  
  window.handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!Auth.isLoggedIn()) {
      Utils.showAlert('お問い合わせを送信するにはログインしてください。');
      window.location.hash = '/';
      return;
    }
    const title = document.getElementById('inquiry-title').value;
    const details = document.getElementById('inquiry-details').value;
    
    if (title && details) {
      DB.addInquiry(Auth.currentUser.id, title, details);
      Utils.showAlert('お問い合わせを送信しました。管理者の確認と返信をお待ちください。');
      document.getElementById('inquiry-form').reset();
    }
  };

  const renderFeatured = () => {
    if (featuredArticles.length === 0) return '<p class="text-center" style="color: var(--text-muted);">おすすめ記事はまだありません。</p>';
    return `
      <div class="grid md:grid-cols-3">
        ${featuredArticles.map(a => Components.ArticleCard(a)).join('')}
      </div>
    `;
  };

  const html = `
    ${Components.Navbar()}
    <main class="main-content">
      <div class="container">
        <div class="hero mb-8">
          <h1>Blender記事市場</h1>
          <p>Blenderユーザーたちが製作工程を記事形式で共有し、学習出来るコミュニティプラットフォームです。記事を読んだり、自分のノウハウを共有しましょう！</p>
        </div>

        <h1 class="mb-8" style="font-size: 2rem; color: var(--text-main);">
          ようこそ、${Utils.escapeHtml(Auth.currentUser.displayName || Auth.currentUser.username)}さん
        </h1>

        <section class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2>おすすめ記事</h2>
          </div>
          ${renderFeatured()}
        </section>

        <section class="mb-8 text-center" style="padding: 3rem 0; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); backdrop-filter: blur(12px); border-radius: var(--radius-lg); color: var(--text-main);">
          <h2 style="color: var(--text-main); margin-bottom: 1rem;">あなたのノウハウを共有しましょう</h2>
          <p style="margin-bottom: 2rem; opacity: 0.9;">Blenderでの制作ステップを簡単に記事にして公開できます。</p>
          <a href="#/create" class="btn btn-primary">新しく記事を書く</a>
        </section>
        
        <section id="contact" style="margin-top: 4rem; padding-top: 3rem; border-top: 1px solid var(--border-color);">
          <div class="card" style="max-width: 600px; margin: 0 auto;">
            <h2 class="text-center mb-4">お問い合わせ</h2>
            <p class="text-center mb-4" style="color: var(--text-muted); font-size: 0.9rem;">
              ご意見、ご要望、不具合の報告、または非公開にされた記事の公開申請などはこちらからご連絡ください。
            </p>
            <form id="inquiry-form" onsubmit="handleInquirySubmit(event)">
              <div class="form-group">
                <label class="form-label">件名</label>
                <input type="text" id="inquiry-title" class="form-control" required placeholder="お問い合わせのタイトル">
              </div>
              <div class="form-group">
                <label class="form-label">詳細</label>
                <textarea id="inquiry-details" class="form-control" rows="5" required placeholder="具体的な内容をご記入ください"></textarea>
              </div>
              <div class="text-center">
                <button type="submit" class="btn btn-primary">送信する</button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
};
