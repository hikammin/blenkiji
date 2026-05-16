window.Pages = window.Pages || {};

Pages.ArticleDetail = (id) => {
  const article = DB.getArticleById(id);
  const currentUser = Auth.currentUser;

  if (!currentUser) {
    window.location.hash = '/';
    return;
  }
  
  if (!article) {
    Utils.renderContent('app', `
      ${Components.Navbar()}
      <div class="container" style="padding-top: 2rem;">
        <h2>記事が見つかりません。</h2>
        <a href="#/articles" class="btn btn-primary mt-4">一覧に戻る</a>
      </div>
    `);
    return;
  }

  Utils.setOGPTags(article.title, article.description, article.thumbnail);

  const articles = DB.getArticles();
  const idx = articles.findIndex(a => a.id === id);

  article.viewedBy = article.viewedBy || [];
  article.likedBy = article.likedBy || [];
  article.comments = article.comments || [];

  if (!article.viewedBy.includes(currentUser.id)) {
    article.views = (article.views || 0) + 1;
    article.viewedBy.push(currentUser.id);
    if (idx !== -1) {
      articles[idx].views = article.views;
      articles[idx].viewedBy = article.viewedBy;
      DB.saveArticles(articles);
    }
  }

  let hasLiked = article.likedBy.includes(currentUser.id);

  window.handleLike = () => {
    if (hasLiked) {
      article.likes = Math.max(0, (article.likes || 0) - 1);
      article.likedBy = article.likedBy.filter(uid => uid !== currentUser.id);
      hasLiked = false;
    } else {
      article.likes = (article.likes || 0) + 1;
      article.likedBy.push(currentUser.id);
      hasLiked = true;
      
      if (article.authorId !== currentUser.id) {
        DB.addNotification(article.authorId, 'like', `${currentUser.displayName || currentUser.username} さんがあなたの記事「${article.title}」にいいねしました。`, article.id);
      }
    }
    
    if (idx !== -1) {
      articles[idx].likes = article.likes;
      articles[idx].likedBy = article.likedBy;
      DB.saveArticles(articles);
    }
    
    document.getElementById('like-count').innerText = article.likes;
    const btn = document.getElementById('like-btn');
    if (hasLiked) {
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-outline');
    } else {
      btn.classList.add('btn-outline');
      btn.classList.remove('btn-primary');
    }
  };

  window.handleCommentSubmit = (e) => {
    e.preventDefault();
    const text = document.getElementById('comment-text').value;
    if (!text.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.displayName || currentUser.username,
      text: text,
      createdAt: new Date().toISOString()
    };

    article.comments.push(newComment);
    if (idx !== -1) {
      articles[idx].comments = article.comments;
      DB.saveArticles(articles);
    }
    
    if (article.authorId !== currentUser.id) {
      DB.addNotification(article.authorId, 'comment', `${currentUser.displayName || currentUser.username} さんがあなたの記事「${article.title}」にコメントしました。`, article.id);
    }

    Pages.ArticleDetail(id);
  };

  window.handleCommentDelete = (commentId) => {
    if (confirm('このコメントを削除しますか？')) {
      article.comments = article.comments.filter(c => c.id !== commentId);
      if (idx !== -1) {
        articles[idx].comments = article.comments;
        DB.saveArticles(articles);
      }
      Pages.ArticleDetail(id);
    }
  };

  window.handleReport = () => {
    const reason = prompt('通報する理由を詳しくご記入ください（不適切な内容、著作権侵害など）:');
    if (reason && reason.trim()) {
      DB.addReport(article.id, currentUser.id, reason.trim());
      Utils.showAlert('通報を送信しました。管理者が確認いたします。');
    }
  };

  const likeBtnClass = hasLiked ? 'btn-primary' : 'btn-outline';

  const thumbHtml = article.thumbnail 
    ? `<div style="margin-top: 1rem; margin-bottom: 2rem; border-radius: var(--radius-lg); overflow: hidden; background: #eee;">
         <img src="${article.thumbnail}" style="width: 100%; max-height: 400px; object-fit: cover;" alt="Thumbnail">
       </div>` 
    : '';

  const tagsHtml = (article.tags && article.tags.length > 0)
    ? `<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem;">
         ${article.tags.map(tag => `<a href="#/articles?tag=${encodeURIComponent(tag)}" style="background: var(--primary-light); color: #fff; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; text-decoration: none; display: inline-block; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"># ${Utils.escapeHtml(tag)}</a>`).join('')}
       </div>`
    : '';

  const commentsHtml = `
    <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
      <h3 style="font-size: 1.5rem; margin-bottom: 1.5rem;">コメント (${article.comments.length})</h3>
      
      <form onsubmit="handleCommentSubmit(event)" style="margin-bottom: 2rem;">
        <div class="form-group">
          <textarea id="comment-text" class="form-control" rows="3" placeholder="記事への感想や質問を書いてみましょう" required></textarea>
        </div>
        <div style="text-align: right;">
          <button type="submit" class="btn btn-primary">コメントを送信</button>
        </div>
      </form>

      <div class="comments-list">
        ${article.comments.length > 0 ? article.comments.map(c => {
          const canDelete = c.userId === currentUser.id || currentUser.role === 'admin';
          const deleteBtn = canDelete 
            ? `<button onclick="handleCommentDelete('${c.id}')" style="background: none; border: none; color: var(--danger); font-size: 0.85rem; cursor: pointer; text-decoration: underline;">削除</button>` 
            : '';

          return `
            <div class="card mb-4" style="padding: 1rem; border-radius: var(--radius);">
              <div class="flex items-center justify-between" style="margin-bottom: 0.5rem;">
                <strong style="color: var(--text-main);"><a href="#/user/${c.userId}" style="color: var(--text-main); text-decoration: none;">👤 <span style="text-decoration: underline;">${Utils.escapeHtml(c.userName)}</span></a></strong>
                <div style="display: flex; gap: 1rem; align-items: center;">
                  <span style="font-size: 0.85rem; color: var(--text-muted);">${Utils.formatDate(c.createdAt)}</span>
                  ${deleteBtn}
                </div>
              </div>
              <p style="white-space: pre-wrap; font-size: 0.95rem; color: var(--text-main); margin-top: 0.5rem;">${Utils.escapeHtml(c.text)}</p>
            </div>
          `;
        }).join('') : '<p style="color: var(--text-muted);">まだコメントはありません。最初のコメントを書いてみましょう！</p>'}
      </div>
    </div>
  `;

  const html = `
    ${Components.Navbar()}
    ${Components.BackButton()}
    <main class="main-content">
      <div class="container" style="max-width: 1000px;">
        <article class="card">
          <header style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
            <div class="flex items-center justify-between" style="gap: 1rem; margin-bottom: 1.5rem;">
              <div style="flex: 1;">
                <h1 style="font-size: 2.5rem; line-height: 1.3; margin-bottom: 0;">${Utils.escapeHtml(article.title)}</h1>
                ${article.authorId === currentUser.id ? `<div style="margin-top: 1rem;"><a href="#/article-edit/${article.id}" class="btn btn-outline">✏️ 記事を編集する</a></div>` : ''}
              </div>
              <div style="display: flex; align-items: flex-start; align-self: stretch; padding-top: 0.5rem;">
                <button onclick="handleReport()" class="btn btn-outline" style="color: var(--danger); border-color: var(--danger); padding: 0.25rem 0.75rem; font-size: 0.85rem; white-space: nowrap;" title="この記事を通報する">⚠️ 通報</button>
              </div>
            </div>
            ${tagsHtml}
            ${thumbHtml}
            <div class="flex items-center justify-between" style="color: var(--text-muted);">
              <div>
                <span><a href="#/user/${article.authorId}" style="color: var(--text-muted); text-decoration: none;">👤 <span style="text-decoration: underline;">${Utils.escapeHtml(article.authorName)}</span></a></span>
                <span style="margin-left: 1rem;">📅 ${Utils.formatDate(article.createdAt)}</span>
              </div>
              <div>
                <span style="margin-right: 1rem;">👁 ${article.views} Views</span>
                <button id="like-btn" onclick="handleLike()" class="btn ${likeBtnClass} gap-2">
                  ❤️ <span id="like-count">${article.likes}</span>
                </button>
              </div>
            </div>
          </header>

          <div style="margin-bottom: 3rem;">
            <p style="font-size: 1.1rem; white-space: pre-wrap; line-height: 1.8;">${Utils.parseMarkdown(article.description || '')}</p>
          </div>

          <div class="sections-section">
            <h2 style="font-size: 1.5rem; margin-bottom: 2rem;">制作手順</h2>
            ${article.steps.map((step, index) => {
              const stepThumb = step.image 
                ? `<div style="margin-bottom: 1rem;"><img src="${step.image}" style="max-width: 100%; border-radius: var(--radius);" alt="Section Image"></div>` 
                : '';
              const stepTitle = step.title 
                ? `<span style="font-size: 1.5rem; margin-left: 0.5rem; color: var(--primary-light); font-family: var(--font-heading);">${Utils.escapeHtml(step.title)}</span>` 
                : '';
              
              return `
                <div style="margin-bottom: 2.5rem;">
                  <h3 style="font-size: 1.3rem; margin-bottom: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; display: flex; align-items: center;">
                    ${index + 1}. ${stepTitle}
                  </h3>
                  <div style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: var(--radius); border: 1px solid var(--border-glass);">
                    ${stepThumb}
                    <div style="white-space: pre-wrap; line-height: 1.8;">${Utils.parseMarkdown(step.text)}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          
          ${commentsHtml}
        </article>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
};
