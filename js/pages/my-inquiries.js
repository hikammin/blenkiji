window.Pages = window.Pages || {};

Pages.MyInquiries = () => {
  const user = Auth.currentUser;
  
  if (!user) {
    window.location.hash = '/';
    return;
  }

  const inquiries = DB.getInquiries().filter(i => i.userId === user.id);

  const html = `
    ${Components.Navbar()}
    ${Components.BackButton()}
    <main class="main-content">
      <div class="container" style="max-width: 800px;">
        <h1 class="mb-8" style="margin: 0;">お問い合わせ履歴</h1>
        
        <div class="card">
          ${inquiries.length > 0 ? inquiries.map(i => `
            <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
              <div class="flex justify-between items-center mb-2">
                <h3 style="margin: 0; font-size: 1.1rem;">${Utils.escapeHtml(i.title)}</h3>
                <span style="background: ${i.status === 'closed' ? 'var(--text-muted)' : 'var(--primary-light)'}; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">
                  ${i.status === 'closed' ? '対応完了' : '対応中'}
                </span>
              </div>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
                送信日時: ${Utils.formatDate(i.createdAt)}
              </p>
              <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; white-space: pre-wrap; font-size: 0.95rem;">
                ${Utils.escapeHtml(i.details)}
              </div>
              
              ${i.replies && i.replies.length > 0 ? `
                <div style="margin-left: 1rem; padding-left: 1rem; border-left: 3px solid var(--primary-light);">
                  <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--primary-dark);">管理者からの返信</h4>
                  ${i.replies.map(rep => `
                    <div style="margin-bottom: 1rem;">
                      <span style="font-size: 0.8rem; color: var(--text-muted);">${Utils.formatDate(rep.createdAt)}</span>
                      <p style="margin: 0; font-size: 0.95rem; white-space: pre-wrap;">${Utils.escapeHtml(rep.message)}</p>
                    </div>
                  `).join('')}
                </div>
              ` : '<p style="font-size: 0.9rem; color: var(--text-muted); margin-left: 1rem;">まだ返信はありません。</p>'}
            </div>
          `).join('') : '<p style="text-align: center; color: var(--text-muted);">過去のお問い合わせはありません。</p>'}
        </div>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
};
