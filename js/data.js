const DATA_STORE = {
  users: [
    {
      id: '1',
      username: '1',
      displayName: 'アドミン',
      email: typeof window !== 'undefined' && window.ENV ? window.ENV.ADMIN_EMAIL : 'admin@example.com',
      password: typeof window !== 'undefined' && window.ENV ? window.ENV.ADMIN_PASS : 'admin123',
      role: 'admin',
      description: '管理者アカウント',
      avatar: '',
      isBanned: false,
      followers: [],
      following: []
    }
  ],
  articles: [],
  notifications: [],
  reports: [],
  inquiries: []
};

function initData() {
  if (!localStorage.getItem('blender_users')) {
    localStorage.setItem('blender_users', JSON.stringify(DATA_STORE.users));
  } else {
    let users = JSON.parse(localStorage.getItem('blender_users'));
    let admin = users.find(u => u.id === '1');
    const targetEmail = typeof window !== 'undefined' && window.ENV ? window.ENV.ADMIN_EMAIL : 'admin@example.com';
    const targetPass = typeof window !== 'undefined' && window.ENV ? window.ENV.ADMIN_PASS : 'admin123';
    
    if (admin && (admin.email !== targetEmail || admin.password !== targetPass)) {
      admin.email = targetEmail;
      admin.password = targetPass;
      localStorage.setItem('blender_users', JSON.stringify(users));
    }
    let migrated = false;
    users.forEach(u => {
      if (u.isBanned === undefined) {
        u.isBanned = false;
        migrated = true;
      }
      if (!u.followers) {
        u.followers = [];
        migrated = true;
      }
      if (!u.following) {
        u.following = [];
        migrated = true;
      }
    });
    if (migrated) {
      localStorage.setItem('blender_users', JSON.stringify(users));
    }
  }
  if (!localStorage.getItem('blender_articles')) {
    localStorage.setItem('blender_articles', JSON.stringify(DATA_STORE.articles));
  }
  if (!localStorage.getItem('blender_notifications')) {
    localStorage.setItem('blender_notifications', JSON.stringify(DATA_STORE.notifications));
  }
  if (!localStorage.getItem('blender_reports')) {
    localStorage.setItem('blender_reports', JSON.stringify(DATA_STORE.reports));
  }
  if (!localStorage.getItem('blender_inquiries')) {
    localStorage.setItem('blender_inquiries', JSON.stringify(DATA_STORE.inquiries));
  }
}

initData();

const DB = {
  getUsers: () => JSON.parse(localStorage.getItem('blender_users') || '[]'),
  saveUsers: (users) => localStorage.setItem('blender_users', JSON.stringify(users)),
  updateUser: (userId, updates) => {
    const users = DB.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      DB.saveUsers(users);
      return users[idx];
    }
    return null;
  },
  toggleFollow: (currentUserId, targetUserId) => {
    const users = DB.getUsers();
    const currentUserIdx = users.findIndex(u => u.id === currentUserId);
    const targetUserIdx = users.findIndex(u => u.id === targetUserId);
    
    if (currentUserIdx === -1 || targetUserIdx === -1 || currentUserId === targetUserId) {
      return false;
    }

    const currentUser = users[currentUserIdx];
    const targetUser = users[targetUserIdx];
    
    const isFollowing = currentUser.following && currentUser.following.includes(targetUserId);
    
    if (isFollowing) {
      currentUser.following = currentUser.following.filter(id => id !== targetUserId);
      targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
    } else {
      currentUser.following = currentUser.following || [];
      targetUser.followers = targetUser.followers || [];
      
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      
      DB.addNotification(targetUserId, 'system', `${currentUser.displayName || currentUser.username} さんにフォローされました。`, currentUserId);
    }
    
    DB.saveUsers(users);
    
    if (Auth.currentUser && Auth.currentUser.id === currentUserId) {
      Auth.updateSession(currentUser);
    }
    return !isFollowing;
  },

  getArticles: () => JSON.parse(localStorage.getItem('blender_articles') || '[]'),
  saveArticles: (articles) => localStorage.setItem('blender_articles', JSON.stringify(articles)),
  getArticleById: (id) => {
    const articles = DB.getArticles();
    return articles.find(a => a.id === id);
  },
  addArticle: (articleData) => {
    if (!articleData.title || articleData.title.trim() === '') throw new Error('タイトルは必須です');
    if (articleData.title.length > 30) throw new Error('タイトルは30文字以内で入力してください');
    
    const sanitize = (str) => typeof str === 'string' ? Utils.escapeHtml(str) : str;
    const sanitizedTitle = sanitize(articleData.title);
    const sanitizedDesc = sanitize(articleData.description);
    
    const sanitizedSteps = (articleData.steps || []).map(step => ({
      ...step,
      title: sanitize(step.title),
      text: sanitize(step.text)
    }));

    const articles = DB.getArticles();
    const newArticle = {
      ...articleData,
      title: sanitizedTitle,
      description: sanitizedDesc,
      steps: sanitizedSteps,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      tags: (articleData.tags || []).map(t => sanitize(t)),
      viewedBy: [],
      likedBy: [],
      comments: []
    };
    articles.push(newArticle);
    DB.saveArticles(articles);
    return newArticle;
  },
  updateArticle: (articleId, updates) => {
    const articles = DB.getArticles();
    const idx = articles.findIndex(a => a.id === articleId);
    if (idx !== -1) {
      const sanitize = (str) => typeof str === 'string' ? Utils.escapeHtml(str) : str;
      if (updates.title !== undefined) {
        if (updates.title.length > 30) throw new Error('タイトルは30文字以内で入力してください');
        updates.title = sanitize(updates.title);
      }
      if (updates.description !== undefined) updates.description = sanitize(updates.description);
      if (updates.steps !== undefined) {
        updates.steps = updates.steps.map(step => ({
          ...step,
          title: sanitize(step.title),
          text: sanitize(step.text)
        }));
      }
      if (updates.tags !== undefined) updates.tags = updates.tags.map(t => sanitize(t));

      articles[idx] = { ...articles[idx], ...updates, updatedAt: new Date().toISOString() };
      DB.saveArticles(articles);
      return articles[idx];
    }
    return null;
  },

  getNotifications: () => JSON.parse(localStorage.getItem('blender_notifications') || '[]'),
  saveNotifications: (notifications) => localStorage.setItem('blender_notifications', JSON.stringify(notifications)),
  addNotification: (userId, type, message, relatedId = null) => {
    const notifications = DB.getNotifications();
    const newNotif = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      userId,
      type,
      message,
      relatedId,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(newNotif);
    DB.saveNotifications(notifications);
    return newNotif;
  },
  markNotificationRead: (notifId) => {
    const notifications = DB.getNotifications();
    const notif = notifications.find(n => n.id === notifId);
    if (notif) {
      notif.read = true;
      DB.saveNotifications(notifications);
    }
  },

  getReports: () => JSON.parse(localStorage.getItem('blender_reports') || '[]'),
  saveReports: (reports) => localStorage.setItem('blender_reports', JSON.stringify(reports)),
  addReport: (articleId, reporterId, reason) => {
    const reports = DB.getReports();
    reports.push({
      id: Date.now().toString(),
      articleId,
      reporterId,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    DB.saveReports(reports);
    
    const admins = DB.getUsers().filter(u => u.role === 'admin');
    admins.forEach(admin => {
      DB.addNotification(admin.id, 'report', '新しい通報がありました。', articleId);
    });
  },

  getInquiries: () => JSON.parse(localStorage.getItem('blender_inquiries') || '[]'),
  saveInquiries: (inquiries) => localStorage.setItem('blender_inquiries', JSON.stringify(inquiries)),
  addInquiry: (userId, title, details) => {
    const inquiries = DB.getInquiries();
    const newInquiry = {
      id: Date.now().toString(),
      userId,
      title,
      details,
      replies: [],
      status: 'open',
      createdAt: new Date().toISOString()
    };
    inquiries.push(newInquiry);
    DB.saveInquiries(inquiries);

    const admins = DB.getUsers().filter(u => u.role === 'admin');
    admins.forEach(admin => {
      DB.addNotification(admin.id, 'inquiry', `新しいお問い合わせ: ${title}`, newInquiry.id);
    });
    return newInquiry;
  },
  addInquiryReply: (inquiryId, senderId, message) => {
    const inquiries = DB.getInquiries();
    const inquiry = inquiries.find(i => i.id === inquiryId);
    if (inquiry) {
      inquiry.replies.push({
        id: Date.now().toString(),
        senderId,
        message,
        createdAt: new Date().toISOString()
      });
      DB.saveInquiries(inquiries);
      
      const sender = DB.getUsers().find(u => u.id === senderId);
      if (sender && sender.role === 'admin' && senderId !== inquiry.userId) {
        DB.addNotification(inquiry.userId, 'inquiry', `お問い合わせ「${inquiry.title}」に返信がありました。`, inquiry.id);
      }
    }
  }
};
