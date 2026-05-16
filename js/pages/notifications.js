window.Pages = window.Pages || {};

Pages.Notifications = () => {
  const currentUser = Auth.currentUser;
  
  if (!currentUser) {
    window.location.hash = '/';
    return;
  }

  const notifications = DB.getNotifications().filter(n => n.userId === currentUser.id);

  notifications.forEach(n => {
    if (!n.read) {
      DB.markNotificationRead(n.id);
      n.read = true;
    }
  });

  const renderIcon = (type) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'report': return '⚠️';
      case 'system': return '🔔';
      case 'inquiry': return '✉️';
      default: return '📢';
    }
  };

  const getLink = (notif) => {
    if (notif.type === 'report') return `href="#/admin"`;
    if (notif.type === 'inquiry') {
      if (currentUser.role === 'admin' && notif.message.includes('新しいお問い合わせ')) return `href="#/admin"`;
      return `href="#/my-inquiries"`;
    }
    if (notif.relatedId) {
      return `href="#/article/${notif.relatedId}"`;
    }
    return '';
  };

  const html = `
    ${Components.Navbar()}
    ${Components.BackButton()}
    <main class="main-content">
      <div class="container" style="max-width: 800px;">
        <h1 class="mb-8">通知一覧</h1>
        
        <div class="card" style="padding: 0;">
          ${notifications.length > 0 ? notifications.map(notif => `
            <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-color); background: transparent; display: flex; gap: 1rem; align-items: flex-start;">
              <div style="font-size: 1.5rem;">${renderIcon(notif.type)}</div>
              <div style="flex: 1;">
                <p style="margin-bottom: 0.5rem; font-weight: normal; color: var(--text-main);">
                  <a ${getLink(notif)} style="color: inherit; text-decoration: none;">${Utils.escapeHtml(notif.message)}</a>
                </p>
                <div style="font-size: 0.85rem; color: var(--text-muted);">
                  ${Utils.formatDate(notif.createdAt)}
                </div>
              </div>
            </div>
          `).join('') : '<div style="padding: 3rem; text-align: center; color: var(--text-muted);">通知はありません。</div>'}
        </div>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
};
