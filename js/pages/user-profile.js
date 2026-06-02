window.Pages = window.Pages || {};

Pages.UserProfile = (id) => {
  const users = DB.getUsers();
  const targetUser = users.find(u => u.id === id);
  const currentUser = Auth.currentUser;

  if (!targetUser) {
    Utils.renderContent('app', `
      ${Components.Navbar()}
      <div class="container" style="padding-top: 2rem;">
        <h2>ユーザーが見つかりません。</h2>
        <a href="#/home" class="btn btn-primary mt-4">ホームに戻る</a>
      </div>
    `);
    return;
  }

  if (currentUser && currentUser.id === id) {
    window.location.hash = '/profile';
    return;
  }

  window.handleGrantAdmin = () => {
    if (confirm(`${targetUser.displayName || targetUser.username} に管理者権限を与えますか？`)) {
      DB.updateUser(targetUser.id, { role: 'admin' });
      Utils.showAlert('管理者権限を付与しました。');
      Pages.UserProfile(id);
    }
  };

  window.handleRevokeAdmin = () => {
    if (confirm(`${targetUser.displayName || targetUser.username} の管理者権限を解除しますか？`)) {
      DB.updateUser(targetUser.id, { role: 'user' });
      Utils.showAlert('管理者権限を解除しました。');
      Pages.UserProfile(id);
    }
  };

  window.handleBanUser = () => {
    if (confirm(`${targetUser.displayName || targetUser.username} の記事投稿を禁止しますか？`)) {
      DB.updateUser(targetUser.id, { isBanned: true });
      DB.addNotification(targetUser.id, 'system', '管理者により記事投稿が禁止されました。心当たりがない場合はお問い合わせください。');
      Utils.showAlert('記事投稿を禁止しました。');
      Pages.UserProfile(id);
    }
  };

  window.handleUnbanUser = () => {
    if (confirm(`${targetUser.displayName || targetUser.username} の記事投稿禁止を解除しますか？`)) {
      DB.updateUser(targetUser.id, { isBanned: false });
      DB.addNotification(targetUser.id, 'system', '管理者により記事投稿の禁止が解除されました。');
      Utils.showAlert('記事投稿禁止を解除しました。');
      Pages.UserProfile(id);
    }
  };

  window.handleToggleFollow = () => {
    if (!currentUser) {
      Utils.showAlert('フォローするにはログインが必要です。');
      return;
    }
    DB.toggleFollow(currentUser.id, targetUser.id);
    Pages.UserProfile(id);
  };

  window.handleDeleteUserByAdmin = () => {
    if (targetUser.id === 'admin' || targetUser.id === '1' || targetUser.username === 'admin') {
      Utils.showAlert('このアカウント（ID: admin）はシステム管理者アカウントのため、削除できません。');
      return;
    }

    Utils.showConfirmModal(
      'ユーザーの削除',
      `【警告】管理者権限により、ユーザー「${targetUser.displayName || targetUser.username}」を完全に削除しますか？\nこの操作は取り消せません。このユーザーのすべての記事やコメントも完全に削除されます。`,
      () => {
        try {
          DB.deleteUser(targetUser.id);
          Utils.showAlert('ユーザーを削除しました。');
          window.location.hash = '/home';
        } catch (e) {
          Utils.showAlert('エラーが発生しました: ' + e.message);
        }
      },
      '強制削除する',
      'キャンセル'
    );
  };

  let adminActionBtn = '';
  if (currentUser && currentUser.id === '1') {
    if (targetUser.role !== 'admin') {
      adminActionBtn = `<button onclick="handleGrantAdmin()" class="btn btn-primary" style="background: var(--warning); border: none;">管理者権限を与える</button>`;
    } else {
      adminActionBtn = `<button onclick="handleRevokeAdmin()" class="btn btn-outline" style="color: var(--danger); border-color: var(--danger);">管理者権限を解除</button>`;
    }
  }

  let banActionBtn = '';
  if (currentUser && Auth.isAdmin() && targetUser.id !== '1') {
    if (targetUser.isBanned) {
      banActionBtn = `<button onclick="handleUnbanUser()" class="btn btn-outline" style="color: var(--success); border-color: var(--success);">🔓 投稿禁止を解除</button>`;
    } else {
      banActionBtn = `<button onclick="handleBanUser()" class="btn btn-outline" style="color: var(--danger); border-color: var(--danger);">🚫 記事投稿を禁止</button>`;
    }
  }

  let deleteActionBtn = '';
  if (currentUser && Auth.isAdmin() && targetUser.id !== '1' && targetUser.id !== 'admin' && targetUser.username !== 'admin') {
    deleteActionBtn = `<button onclick="handleDeleteUserByAdmin()" class="btn btn-outline" style="color: var(--danger); border-color: var(--danger); background: rgba(220, 53, 69, 0.1);">👤 ユーザーを削除</button>`;
  }

  const twitterHtml = targetUser.twitter 
    ? `<a href="${targetUser.twitter.startsWith('http') ? Utils.escapeHtml(targetUser.twitter) : 'https://twitter.com/' + Utils.escapeHtml(targetUser.twitter.replace('@', ''))}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:0.4rem; color:#1DA1F2; text-decoration:none; margin-right: 1.5rem; font-size: 0.95rem; font-weight:500; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
         <span style="font-size:1.1rem;">🐦</span> Twitter (X)
       </a>`
    : '';

  const youtubeHtml = targetUser.youtube 
    ? `<a href="${targetUser.youtube.startsWith('http') ? Utils.escapeHtml(targetUser.youtube) : 'https://youtube.com/' + (targetUser.youtube.startsWith('@') ? Utils.escapeHtml(targetUser.youtube) : '@' + Utils.escapeHtml(targetUser.youtube))}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:0.4rem; color:#FF0000; text-decoration:none; font-size: 0.95rem; font-weight:500; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
         <span style="font-size:1.1rem;">📺</span> YouTube
       </a>`
    : '';

  const snsLinksHtml = (twitterHtml || youtubeHtml) 
    ? `<div style="margin-top: 0.5rem; margin-bottom: 0.75rem; display: flex; align-items: center; flex-wrap: wrap;">
         ${twitterHtml}
         ${youtubeHtml}
       </div>`
    : '';

  let userArticles = DB.getArticles().filter(a => a.authorId === id && a.isPublic);
  userArticles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const userDisplay = targetUser.displayName || 'ユーザー' + targetUser.username;
  const avatarHtml = targetUser.avatar 
    ? `<img src="${targetUser.avatar}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">`
    : `<div style="width: 80px; height: 80px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: bold;">${userDisplay.charAt(0).toUpperCase()}</div>`;

  const html = `
    ${Components.Navbar()}
    ${Components.BackButton()}
    <main class="main-content">
      <div class="container" style="max-width: 800px;">
        <div class="card mb-8">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-4">
              ${avatarHtml}
              <div>
                <h1 style="font-size: 2rem; margin-bottom: 0.25rem;">${Utils.escapeHtml(userDisplay)}</h1>
                <p style="color: var(--text-muted); margin-bottom: 0.5rem;">ID: ${Utils.escapeHtml(targetUser.username)}</p>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                  <span style="display: inline-block; padding: 0.2rem 0.5rem; background: rgba(0,0,0,0.3); border-radius: 4px; font-size: 0.8rem; border: 1px solid var(--border-glass);">
                    権限: ${targetUser.role === 'admin' ? '管理者' : '一般ユーザー'}
                  </span>
                  ${targetUser.isBanned ? `<span style="display: inline-block; padding: 0.2rem 0.5rem; background: var(--danger); color: white; border-radius: 4px; font-size: 0.8rem;">🚫 投稿禁止中</span>` : ''}
                </div>
                ${snsLinksHtml}
                <div style="display: flex; gap: 1.5rem; font-size: 0.95rem;">
                  <div style="cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-main)'" onclick="Utils.showUserListModal('フォロー中', [${(targetUser.following || []).map(x => `'${x}'`).join(',')}])">
                    <strong style="color: var(--text-main);">${(targetUser.following || []).length}</strong> <span style="color: var(--text-muted);">フォロー中</span>
                  </div>
                  <div style="cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-main)'" onclick="Utils.showUserListModal('フォロワー', [${(targetUser.followers || []).map(x => `'${x}'`).join(',')}])">
                    <strong style="color: var(--text-main);">${(targetUser.followers || []).length}</strong> <span style="color: var(--text-muted);">フォロワー</span>
                  </div>
                </div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${currentUser ? `
                <button onclick="handleToggleFollow()" class="btn ${currentUser.following && currentUser.following.includes(targetUser.id) ? 'btn-outline' : 'btn-primary'}">
                  ${currentUser.following && currentUser.following.includes(targetUser.id) ? 'フォロー中' : 'フォローする'}
                </button>
              ` : ''}
              ${adminActionBtn}
              ${banActionBtn}
              ${deleteActionBtn}
            </div>
          </div>
          ${targetUser.description ? `<div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); white-space: pre-wrap; color: var(--text-main); line-height: 1.6;">${Utils.escapeHtml(targetUser.description)}</div>` : ''}
        </div>

        <h2 class="mb-4">${Utils.escapeHtml(userDisplay)} の公開記事（${userArticles.length}件）</h2>
        
        ${userArticles.length > 0 ? `
          <div class="grid md:grid-cols-2">
            ${userArticles.map(a => Components.ArticleCard(a)).join('')}
          </div>
        ` : `
          <div class="card text-center" style="padding: 3rem;">
            <p style="color: var(--text-muted); margin-bottom: 1rem;">まだ公開された記事がありません。</p>
          </div>
        `}
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
};
