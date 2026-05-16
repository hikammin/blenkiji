window.Pages = window.Pages || {};

Pages.Articles = () => {
  let allArticles = DB.getArticles().filter(a => a.isPublic);
  let currentSort = 'newest';
  let searchQuery = '';
  let userSearchQuery = '';

  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const tagParam = urlParams.get('tag') || '';
  let selectedTags = tagParam ? tagParam.split(',').map(t => decodeURIComponent(t)) : [];

  const availableTags = ["モデリング", "スカルプト", "テクスチャ", "アニメーション", "Geometry Nodes", "リギング", "レンダリング", "アドオン", "初心者向け"];

  window.setTagFilter = (tag) => {
    const idx = selectedTags.indexOf(tag);
    if (idx !== -1) {
      selectedTags.splice(idx, 1);
    } else {
      selectedTags.push(tag);
    }
    const container = document.getElementById('tags-filter-container');
    if (container) container.innerHTML = renderTagsUI();
    renderArticles();
  };

  const renderTagsUI = () => {
    return availableTags.map(tag => {
      const isActive = selectedTags.includes(tag);
      const bg = isActive ? 'var(--primary)' : 'var(--bg-color)';
      const color = isActive ? '#fff' : 'var(--text-main)';
      const border = isActive ? 'var(--primary)' : 'var(--border-color)';
      return `<button onclick="setTagFilter('${tag}')" style="background: ${bg}; color: ${color}; border: 1px solid ${border}; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; white-space: nowrap;">${tag}</button>`;
    }).join('');
  };

  const renderArticles = () => {
    let filtered = allArticles;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(q));
    }

    if (userSearchQuery) {
      const uq = userSearchQuery.toLowerCase();
      const users = DB.getUsers();
      const matchedUserIds = users
        .filter(u => 
          u.username.toLowerCase().includes(uq) || 
          u.id.toLowerCase().includes(uq) ||
          (u.displayName && u.displayName.toLowerCase().includes(uq))
        )
        .map(u => u.id);
      filtered = filtered.filter(a => matchedUserIds.includes(a.authorId));
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(a => a.tags && selectedTags.some(t => a.tags.includes(t)));
    }

    filtered.sort((a, b) => {
      if (currentSort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (currentSort === 'views') return b.views - a.views;
      if (currentSort === 'likes') return b.likes - a.likes;
      return 0;
    });

    const container = document.getElementById('articles-list');
    if (filtered.length > 0) {
      container.innerHTML = filtered.map(a => Components.ArticleCard(a)).join('');
    } else {
      container.innerHTML = '<p class="text-muted" style="grid-column: 1 / -1;">条件に一致する記事が見つかりません。</p>';
    }
  };

  window.handleSearch = (e) => {
    searchQuery = e.target.value;
    renderArticles();
  };

  window.handleUserSearch = (e) => {
    userSearchQuery = e.target.value;
    renderArticles();
  };

  window.handleSort = (e) => {
    currentSort = e.target.value;
    renderArticles();
  };

  const html = `
    ${Components.Navbar()}
    <main class="main-content">
      <div class="container">
        <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 style="font-size: 2rem;">すべての記事</h1>
          <a href="#/create" class="btn btn-primary">新しく記事を書く</a>
        </div>
        
        <div class="card mb-8" style="padding: 1rem;">
          <div class="flex flex-wrap gap-4 items-center">
            <div style="flex: 1; min-width: 200px;">
              <input type="text" placeholder="記事のタイトルで検索..." class="form-control" oninput="handleSearch(event)">
            </div>
            <div style="flex: 1; min-width: 200px;">
              <input type="text" placeholder="ユーザー番号・名前で検索..." class="form-control" oninput="handleUserSearch(event)">
            </div>
            <div>
              <select class="form-control" onchange="handleSort(event)">
                <option value="newest">最新順</option>
                <option value="views">閲覧回数順</option>
                <option value="likes">いいね順</option>
              </select>
            </div>
          </div>
          <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">人気のタグで絞り込む</p>
            <div class="flex flex-wrap gap-2" id="tags-filter-container">
              ${renderTagsUI()}
            </div>
          </div>
        </div>
        
        <div id="articles-list" class="grid md:grid-cols-3">
        </div>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
  
  setTimeout(renderArticles, 0);
};
