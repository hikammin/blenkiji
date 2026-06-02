const Components = {
  Navbar: () => {
    if (!Auth.isLoggedIn()) {
      return `
        <nav class="navbar">
          <div class="container">
            <a href="#/" class="logo">Blender記事市場</a>
            <div class="nav-links">
              <button onclick="document.getElementById('login-section').scrollIntoView({behavior: 'smooth'})" class="btn btn-primary">ログイン / 新規登録</button>
            </div>
          </div>
        </nav>
      `;
    }

    const adminLink = Auth.isAdmin() ? `<a href="#/admin" class="btn btn-outline">管理者設定</a>` : '';
    const user = Auth.currentUser;
    const userDisplay = user.displayName || 'ユーザー' + user.username;
    
    const writeLink = user.isBanned ? '' : `<a href="#/create" class="btn btn-outline">記事を書く</a>`;

    const unreadCount = DB.getNotifications().filter(n => n.userId === user.id && !n.read).length;
    const badgeHtml = unreadCount > 0 
      ? `<span style="position:absolute; top:-5px; right:-8px; background:var(--danger); color:white; font-size:0.7rem; padding:0.1rem 0.3rem; border-radius:10px; font-weight:bold;">${unreadCount}</span>` 
      : '';

    const avatarHtml = user.avatar 
      ? `<img src="${user.avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; display: inline-block; vertical-align: middle;">`
      : `<div style="width: 32px; height: 32px; background: var(--primary-light); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; vertical-align: middle;">${userDisplay.charAt(0).toUpperCase()}</div>`;

    return `
      <nav class="navbar">
        <div class="container">
          <a href="#/home" class="logo">Blender記事市場</a>
          <button class="hamburger-btn" onclick="toggleMobileNav()" aria-label="メニュー">
            <span></span><span></span><span></span>
          </button>
          <div class="nav-links" id="nav-links">
            <a href="#/articles" class="btn btn-outline">記事一覧</a>
            ${writeLink}
            ${adminLink}
            <a href="#/notifications" style="position:relative; color: var(--text-main); text-decoration:none; font-size:1.2rem;" title="通知">
              🔔
              ${badgeHtml}
            </a>
            <a href="#/profile" style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-main);">
              ${avatarHtml}
              <span style="font-weight: 500;">${Utils.escapeHtml(userDisplay)}</span>
            </a>
            <button onclick="Auth.logout()" class="btn btn-outline" style="padding: 0.25rem 0.75rem; font-size: 0.9rem;">ログアウト</button>
          </div>
        </div>
      </nav>
    `;
  },

  ArticleCard: (article) => {
    const thumbHtml = article.thumbnail 
      ? `<div style="height: 150px; overflow: hidden; border-radius: var(--radius) var(--radius) 0 0; margin: -1.5rem -1.5rem 1rem -1.5rem; background: rgba(255,255,255,0.05); border-bottom: 1px solid var(--border-glass);">
           <img src="${article.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;" alt="Thumbnail">
         </div>` 
      : `<div style="height: 150px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); border-bottom: 1px solid var(--border-glass); border-radius: var(--radius) var(--radius) 0 0; margin: -1.5rem -1.5rem 1rem -1.5rem; color: var(--text-muted); font-family: var(--font-mono); font-size: 0.85rem;">No Image</div>`;

    const tagsHtml = (article.tags && article.tags.length > 0)
      ? `<div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.8rem;">
           ${article.tags.map(tag => `<span style="background: rgba(0,0,0,0.3); color: var(--text-muted); border: 1px solid var(--border-glass); padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem;">${Utils.escapeHtml(tag)}</span>`).join('')}
         </div>`
      : '';

    return `
      <div onclick="window.location.hash='/article/${article.id}'" class="card article-card" style="display: flex; flex-direction: column; cursor: pointer;">
        ${thumbHtml}
        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem; line-height: 1.4;">
          ${Utils.escapeHtml(article.title)}
        </h3>
        ${tagsHtml}
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem; flex: 1;">
          ${Utils.escapeHtml(article.description || '説明がありません。')}
        </p>
        <div class="article-meta" onclick="event.stopPropagation()">
          <span><a href="#/user/${article.authorId}" style="color: var(--text-muted); text-decoration: none;">👤 <span style="text-decoration: underline;">${Utils.escapeHtml(article.authorName)}</span></a></span>
          <div>
            <span style="margin-right: 0.5rem">👁 ${article.views || 0}</span>
            <span>❤️ ${article.likes || 0}</span>
          </div>
        </div>
      </div>
    `;
  },

  BackButton: () => `
    <div class="container" style="padding-top: 1rem; padding-bottom: 0;">
      <button onclick="window.history.length > 1 ? history.back() : window.location.hash='/home'" class="btn btn-outline" style="border: none; padding: 0.5rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted);">
        <span style="font-size: 1.2rem;">←</span> 戻る
      </button>
    </div>
  `,

  Footer: () => {
    return `
      <footer style="background-color: rgba(255,255,255,0.02); color: var(--text-main); padding: 4rem 0 2rem 0; margin-top: 4rem; border-top: 1px solid var(--border-glass);">
        <div class="container">
          <div class="grid md:grid-cols-3" style="gap: 3rem; margin-bottom: 3rem;">
            <div style="grid-column: span 1;">
              <a href="#/home" style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700; color: var(--primary); text-decoration: none; margin-bottom: 1rem; display: inline-block; letter-spacing: -0.02em;">Blender記事市場</a>
              <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">Blenderユーザーのためのノウハウ共有プラットフォーム</p>
            </div>
            
            <div style="grid-column: span 2; display: flex; flex-wrap: wrap; gap: 4rem;">
              <div>
                <h4 style="font-family: var(--font-heading); font-weight: 700; margin-bottom: 1rem; color: var(--text-main);">クイックリンク</h4>
                <ul style="list-style: none; padding: 0;">
                  <li style="margin-bottom: 0.5rem;"><a href="#/home" style="color: var(--text-muted); text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-muted)'">ホーム</a></li>
                  <li style="margin-bottom: 0.5rem;"><a href="#/articles" style="color: var(--text-muted); text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-muted)'">記事一覧</a></li>
                  <li style="margin-bottom: 0.5rem;"><a href="#/create" style="color: var(--text-muted); text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-muted)'">記事を書く</a></li>
                </ul>
              </div>
              <div>
                <h4 style="font-family: var(--font-heading); font-weight: 700; margin-bottom: 1rem; color: var(--text-main);">サポート & 規約</h4>
                <ul style="list-style: none; padding: 0;">
                  <li style="margin-bottom: 0.5rem;"><a href="#/home#contact" style="color: var(--text-muted); text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-muted)'">お問い合わせ</a></li>
                  <li style="margin-bottom: 0.5rem;"><a href="#/tos" style="color: var(--text-muted); text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-muted)'">利用規約</a></li>
                  <li style="margin-bottom: 0.5rem;"><a href="#/privacy" style="color: var(--text-muted); text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-muted)'">プライバシーポリシー</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; border-top: 1px solid var(--border-glass); padding-top: 2rem;">
            <p style="margin-bottom: 0.5rem; font-family: var(--font-mono);">&copy; 2026 Blender記事市場. All rights reserved.</p>
            <p>※本サイトは開発中のデモ作品です。入力されたデータは予告なく削除される場合があります。</p>
          </div>
        </div>
      </footer>
    `;
  }
};

window.toggleMobileNav = () => {
  const navLinks = document.getElementById('nav-links');
  if (navLinks) {
    navLinks.classList.toggle('nav-open');
  }
};
