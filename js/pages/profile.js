window.Pages = window.Pages || {};

Pages.Profile = () => {
  const user = Auth.currentUser;
  let userArticles = DB.getArticles().filter(a => a.authorId === user.id);
  let currentSort = 'newest';
  let searchQuery = '';

  const renderProfileArticles = () => {
    let filtered = userArticles;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(q));
    }

    filtered.sort((a, b) => {
      if (currentSort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (currentSort === 'views') return b.views - a.views;
      if (currentSort === 'likes') return b.likes - a.likes;
      return 0;
    });

    const container = document.getElementById('profile-articles-list');
    if (filtered.length > 0) {
      container.innerHTML = `
        <div class="grid md:grid-cols-2">
          ${filtered.map(a => Components.ArticleCard(a)).join('')}
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="card text-center" style="padding: 3rem;">
          <p style="color: var(--text-muted); margin-bottom: 1rem;">条件に一致する投稿がありません。</p>
          <a href="#/create" class="btn btn-primary">新しく記事を書く</a>
        </div>
      `;
    }
  };

  window.handleProfileSearch = (e) => {
    searchQuery = e.target.value;
    renderProfileArticles();
  };

  window.handleProfileSort = (e) => {
    currentSort = e.target.value;
    renderProfileArticles();
  };

  const userDisplay = user.displayName || 'ユーザー' + user.username;
  const avatarHtml = user.avatar 
    ? `<img src="${user.avatar}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">`
    : `<div style="width: 80px; height: 80px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: bold;">${userDisplay.charAt(0).toUpperCase()}</div>`;

  const twitterHtml = user.twitter 
    ? `<a href="${user.twitter.startsWith('http') ? Utils.escapeHtml(user.twitter) : 'https://twitter.com/' + Utils.escapeHtml(user.twitter.replace('@', ''))}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:0.4rem; color:#1DA1F2; text-decoration:none; margin-right: 1.5rem; font-size: 0.95rem; font-weight:500; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
         <span style="font-size:1.1rem;">🐦</span> Twitter (X)
       </a>`
    : '';

  const youtubeHtml = user.youtube 
    ? `<a href="${user.youtube.startsWith('http') ? Utils.escapeHtml(user.youtube) : 'https://youtube.com/' + (user.youtube.startsWith('@') ? Utils.escapeHtml(user.youtube) : '@' + Utils.escapeHtml(user.youtube))}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:0.4rem; color:#FF0000; text-decoration:none; font-size: 0.95rem; font-weight:500; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
         <span style="font-size:1.1rem;">📺</span> YouTube
       </a>`
    : '';

  const snsLinksHtml = (twitterHtml || youtubeHtml) 
    ? `<div style="margin-top: 0.5rem; margin-bottom: 0.75rem; display: flex; align-items: center; flex-wrap: wrap;">
         ${twitterHtml}
         ${youtubeHtml}
       </div>`
    : '';

  const html = `
    ${Components.Navbar()}
    <main class="main-content">
      <div class="container" style="max-width: 800px;">
        <div class="card mb-8">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-4">
              ${avatarHtml}
              <div>
                <h1 style="font-size: 2rem; margin-bottom: 0.25rem;">${Utils.escapeHtml(userDisplay)}</h1>
                <p style="color: var(--text-muted); margin-bottom: 0.5rem;">ID: ${Utils.escapeHtml(user.username)}</p>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                  <span style="display: inline-block; padding: 0.2rem 0.5rem; background: rgba(0,0,0,0.3); border-radius: 4px; font-size: 0.8rem; border: 1px solid var(--border-glass);">
                    権限: ${user.role === 'admin' ? '管理者' : '一般ユーザー'}
                  </span>
                </div>
                ${snsLinksHtml}
                <div style="display: flex; gap: 1.5rem; font-size: 0.95rem;">
                  <div style="cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-main)'" onclick="Utils.showUserListModal('フォロー中', [${(user.following || []).map(x => `'${x}'`).join(',')}])">
                    <strong style="color: var(--text-main);">${(user.following || []).length}</strong> <span style="color: var(--text-muted);">フォロー中</span>
                  </div>
                  <div style="cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-main)'" onclick="Utils.showUserListModal('フォロワー', [${(user.followers || []).map(x => `'${x}'`).join(',')}])">
                    <strong style="color: var(--text-main);">${(user.followers || []).length}</strong> <span style="color: var(--text-muted);">フォロワー</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <a href="#/settings" class="btn btn-outline">プロフィールを編集</a>
            </div>
          </div>
          ${user.description ? `<div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); white-space: pre-wrap; color: var(--text-main); line-height: 1.6;">${Utils.escapeHtml(user.description)}</div>` : ''}
        </div>

        <div class="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h2 style="margin: 0;">あなたの投稿（${userArticles.length}件）</h2>
        </div>

        <div class="card mb-8" style="padding: 1rem;">
          <div class="flex flex-wrap gap-4 items-center">
            <div style="flex: 1; min-width: 250px;">
              <input type="text" placeholder="記事のタイトルで検索..." class="form-control" oninput="handleProfileSearch(event)">
            </div>
            <div>
              <select class="form-control" onchange="handleProfileSort(event)">
                <option value="newest">最新順</option>
                <option value="views">閲覧回数順</option>
                <option value="likes">いいね順</option>
              </select>
            </div>
          </div>
        </div>

        <div id="profile-articles-list">
        </div>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);

  setTimeout(renderProfileArticles, 0);
};
