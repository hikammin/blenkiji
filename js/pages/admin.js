window.Pages = window.Pages || {};

Pages.Admin = async () => {
  const isVerifiedAdmin = await Auth.verifyAdminToken();
  
  if (!isVerifiedAdmin) {
    console.error('【セキュリティ】管理者権限の検証に失敗しました。アクセスを拒否します。');
    window.location.hash = '/';
    return;
  }

  const allArticles = DB.getArticles();
  const allUsers = DB.getUsers();
  const reportsAll = DB.getReports();
  let adminUserSearch = Pages._adminUserSearch || '';

  Pages._adminReportPage = Pages._adminReportPage || 1;
  const reportItemsPerPage = 5;
  const reportTotalPages = Math.ceil(reportsAll.length / reportItemsPerPage) || 1;
  if (Pages._adminReportPage > reportTotalPages) Pages._adminReportPage = reportTotalPages;

  const reportStartIndex = (Pages._adminReportPage - 1) * reportItemsPerPage;
  const pagedReports = reportsAll.slice(reportStartIndex, reportStartIndex + reportItemsPerPage);

  window.changeReportPage = (delta) => {
    Pages._adminReportPage += delta;
    Pages.Admin();
  };

  const inquiriesAll = DB.getInquiries();
  const openInquiries = inquiriesAll.filter(i => i.status !== 'closed');
  
  Pages._adminInquiryPage = Pages._adminInquiryPage || 1;
  const itemsPerPage = 3;
  const totalPages = Math.ceil(openInquiries.length / itemsPerPage) || 1;
  if (Pages._adminInquiryPage > totalPages) Pages._adminInquiryPage = totalPages;

  const startIndex = (Pages._adminInquiryPage - 1) * itemsPerPage;
  const pagedInquiries = openInquiries.slice(startIndex, startIndex + itemsPerPage);

  window.changeInquiryPage = (delta) => {
    Pages._adminInquiryPage += delta;
    Pages.Admin();
  };

  window.handleAdminUserSearch = (e) => {
    Pages._adminUserSearch = e.target.value;
    Pages.Admin();
  };

  let articles = allArticles;
  if (adminUserSearch) {
    const uq = adminUserSearch.toLowerCase();
    const users = DB.getUsers();
    const matchedUserIds = users
      .filter(u =>
        u.username.toLowerCase().includes(uq) ||
        u.id.toLowerCase().includes(uq) ||
        (u.displayName && u.displayName.toLowerCase().includes(uq))
      )
      .map(u => u.id);
    articles = allArticles.filter(a => matchedUserIds.includes(a.authorId));
  }

  window.handleTogglePublic = (id) => {
    const idx = allArticles.findIndex(a => a.id === id);
    if (idx !== -1) {
      allArticles[idx].isPublic = !allArticles[idx].isPublic;
      DB.saveArticles(allArticles);
      
      if (!allArticles[idx].isPublic) {
        DB.addNotification(allArticles[idx].authorId, 'system', `あなたの記事「${allArticles[idx].title}」は管理者により非公開に設定されました。再公開をご希望の場合は、お手数ですがお問い合わせフォームよりご連絡ください。`, id);
      } else {
        DB.addNotification(allArticles[idx].authorId, 'system', `あなたの記事「${allArticles[idx].title}」が管理者により再公開されました。`, id);
      }
      
      Pages.Admin();
    }
  };

  window.handleDeleteArticle = (id) => {
    if (confirm('本当にこの記事を削除しますか？この操作は取り消せません。')) {
      const idx = allArticles.findIndex(a => a.id === id);
      if (idx !== -1) {
        const title = allArticles[idx].title;
        const authorId = allArticles[idx].authorId;
        
        const newArticles = allArticles.filter(a => a.id !== id);
        DB.saveArticles(newArticles);
        
        DB.addNotification(authorId, 'system', `あなたの記事「${title}」は管理者により削除されました。`);
        
        Pages.Admin();
      }
    }
  };

  window.handleToggleFeatured = (id) => {
    const idx = allArticles.findIndex(a => a.id === id);
    if (idx !== -1) {
      allArticles[idx].isFeatured = !allArticles[idx].isFeatured;
      DB.saveArticles(allArticles);
      Pages.Admin();
    }
  };

  window.handleResolveReport = (id) => {
    const rIdx = reportsAll.findIndex(r => r.id === id);
    if (rIdx !== -1) {
      reportsAll[rIdx].status = 'resolved';
      DB.saveReports(reportsAll);
      Pages.Admin();
    }
  };

  window.handleInquiryReply = (id) => {
    const message = prompt('このお問い合わせへの返信を入力してください:');
    if (message && message.trim()) {
      DB.addInquiryReply(id, Auth.currentUser.id, message.trim());
      Pages.Admin();
    }
  };

  window.handleCloseInquiry = (id) => {
    const idx = inquiriesAll.findIndex(i => i.id === id);
    if (idx !== -1) {
      inquiriesAll[idx].status = 'closed';
      DB.saveInquiries(inquiriesAll);
      Pages.Admin();
    }
  };

  const html = `
    ${Components.Navbar()}
    ${Components.BackButton()}
    <main class="main-content">
      <div class="container">
        <h1 class="mb-8">管理者ダッシュボード</h1>
        
        <div class="grid md:grid-cols-2 mb-8" style="gap: 1.5rem;">
          <div class="card text-center">
            <h3 style="color: var(--text-muted); font-size: 1rem; margin-bottom: 0.5rem;">総記事数</h3>
            <p style="font-size: 2rem; font-weight: bold; color: var(--primary); margin: 0;">${allArticles.length}</p>
          </div>
          <div class="card text-center">
            <h3 style="color: var(--text-muted); font-size: 1rem; margin-bottom: 0.5rem;">登録ユーザー数</h3>
            <p style="font-size: 2rem; font-weight: bold; color: var(--primary); margin: 0;">${allUsers.length}</p>
          </div>
        </div>
        
        <div class="card mb-8">
          <h2 class="mb-4">通報一覧</h2>
          <div style="overflow-x: auto;">
            <table style="width: 100%; text-align: left; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid var(--border-color);">
                  <th style="padding: 1rem;">日付</th>
                  <th style="padding: 1rem;">記事ID</th>
                  <th style="padding: 1rem;">通報者ID</th>
                  <th style="padding: 1rem;">理由</th>
                  <th style="padding: 1rem;">ステータス</th>
                  <th style="padding: 1rem;">操作</th>
                </tr>
              </thead>
              <tbody>
                ${pagedReports.length > 0 ? pagedReports.map(r => `
                  <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 1rem;">${Utils.formatDate(r.createdAt)}</td>
                    <td style="padding: 1rem;"><a href="#/article/${r.articleId}">${r.articleId}</a></td>
                    <td style="padding: 1rem;"><a href="#/user/${r.reporterId}">${r.reporterId}</a></td>
                    <td style="padding: 1rem; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${Utils.escapeHtml(r.reason)}</td>
                    <td style="padding: 1rem;">
                      <span style="background: ${r.status === 'resolved' ? 'var(--primary-light)' : 'var(--warning)'}; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">
                        ${r.status === 'resolved' ? '対応済' : '未対応'}
                      </span>
                    </td>
                    <td style="padding: 1rem;">
                      ${r.status === 'pending' ? `<button onclick="handleResolveReport('${r.id}')" class="btn btn-outline" style="font-size: 0.85rem; padding: 0.25rem 0.5rem;">完了にする</button>` : ''}
                    </td>
                  </tr>
                `).join('') : '<tr><td colspan="6" style="padding: 1rem; text-align: center;">通報はありません。</td></tr>'}
              </tbody>
            </table>
          </div>

          ${reportTotalPages > 1 ? `
            <div class="flex justify-center items-center mt-4 gap-4">
              <button onclick="changeReportPage(-1)" class="btn btn-outline" ${Pages._adminReportPage === 1 ? 'disabled' : ''}>前のページ</button>
              <span>${Pages._adminReportPage} / ${reportTotalPages} ページ</span>
              <button onclick="changeReportPage(1)" class="btn btn-outline" ${Pages._adminReportPage === reportTotalPages ? 'disabled' : ''}>次のページ</button>
            </div>
          ` : ''}
        </div>

        <div class="card mb-8">
          <h2 class="mb-4">お問い合わせ一覧（対応中のみ表示）</h2>
          <div>
            ${pagedInquiries.length > 0 ? pagedInquiries.map(i => `
              <div style="border: 1px solid var(--border-color); padding: 1rem; margin-bottom: 1rem; border-radius: var(--radius);">
                <div class="flex justify-between items-center mb-2">
                  <h3 style="margin: 0;">${Utils.escapeHtml(i.title)}</h3>
                  <span style="background: ${i.status === 'closed' ? 'var(--text-muted)' : 'var(--danger)'}; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">
                    ${i.status === 'closed' ? '完了' : '対応中'}
                  </span>
                </div>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
                  送信者: <a href="#/user/${i.userId}">${i.userId}</a> | 送信日時: ${Utils.formatDate(i.createdAt)}
                </p>
                <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; white-space: pre-wrap;">
                  ${Utils.escapeHtml(i.details)}
                </div>
                
                ${i.replies && i.replies.length > 0 ? `
                  <div style="margin-left: 2rem; margin-bottom: 1rem; padding-left: 1rem; border-left: 2px solid var(--primary-light);">
                    <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem;">返信履歴</h4>
                    ${i.replies.map(rep => `
                      <div style="margin-bottom: 0.5rem;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${Utils.formatDate(rep.createdAt)}</span>
                        <p style="margin: 0; font-size: 0.95rem;">${Utils.escapeHtml(rep.message)}</p>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <div class="flex gap-2">
                  <button onclick="handleInquiryReply('${i.id}')" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.25rem 0.5rem;">返信する</button>
                  ${i.status === 'open' ? `<button onclick="handleCloseInquiry('${i.id}')" class="btn btn-outline" style="font-size: 0.85rem; padding: 0.25rem 0.5rem;">対応完了にする</button>` : ''}
                </div>
              </div>
            `).join('') : '<p style="text-align: center;">対応中のお問い合わせはありません。</p>'}
          </div>
          
          ${totalPages > 1 ? `
            <div class="flex justify-center items-center mt-4 gap-4">
              <button onclick="changeInquiryPage(-1)" class="btn btn-outline" ${Pages._adminInquiryPage === 1 ? 'disabled' : ''}>前のページ</button>
              <span>${Pages._adminInquiryPage} / ${totalPages} ページ</span>
              <button onclick="changeInquiryPage(1)" class="btn btn-outline" ${Pages._adminInquiryPage === totalPages ? 'disabled' : ''}>次のページ</button>
            </div>
          ` : ''}
        </div>

        <div class="card">
          <h2 class="mb-4">全記事管理</h2>
          <div class="mb-4" style="max-width: 400px;">
            <input type="text" placeholder="ユーザー番号・名前で記事を絞り込む..." class="form-control" oninput="handleAdminUserSearch(event)" value="${Utils.escapeHtml(adminUserSearch)}">
          </div>
          <div style="overflow-x: auto;">
            <table style="width: 100%; text-align: left; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid var(--border-color);">
                  <th style="padding: 1rem;">タイトル</th>
                  <th style="padding: 1rem;">作成者</th>
                  <th style="padding: 1rem;">ステータス</th>
                  <th style="padding: 1rem;">おすすめ</th>
                  <th style="padding: 1rem;">操作</th>
                </tr>
              </thead>
              <tbody>
                ${articles.map(article => `
                  <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 1rem;"><a href="#/article/${article.id}">${Utils.escapeHtml(article.title)}</a></td>
                    <td style="padding: 1rem;"><a href="#/user/${article.authorId}">${Utils.escapeHtml(article.authorName)}</a></td>
                    <td style="padding: 1rem;">
                      <span style="background: ${article.isPublic ? 'var(--primary-light)' : 'var(--text-muted)'}; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">
                        ${article.isPublic ? '公開中' : '非公開'}
                      </span>
                    </td>
                    <td style="padding: 1rem;">
                      ${article.isFeatured ? '⭐' : ''}
                    </td>
                    <td style="padding: 1rem;">
                      <button onclick="handleTogglePublic('${article.id}')" class="btn btn-outline" style="font-size: 0.85rem; padding: 0.25rem 0.5rem; margin-right: 0.5rem;">
                        ${article.isPublic ? '非公開にする' : '公開にする'}
                      </button>
                      <button onclick="handleToggleFeatured('${article.id}')" class="btn btn-outline" style="font-size: 0.85rem; padding: 0.25rem 0.5rem; margin-right: 0.5rem;">
                        ${article.isFeatured ? 'おすすめ解除' : 'おすすめ設定'}
                      </button>
                      <button onclick="handleDeleteArticle('${article.id}')" class="btn btn-outline" style="color: var(--danger); border-color: var(--danger); font-size: 0.85rem; padding: 0.25rem 0.5rem;">削除</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
};
