const Auth = {
  currentUser: null,

  init: () => {
    let savedUser = sessionStorage.getItem('blender_current_user');
    if (!savedUser) {
      savedUser = localStorage.getItem('blender_current_user');
    }
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const users = DB.getUsers();
        const freshUser = users.find(u => u.id === parsed.id);
        if (freshUser) {
          Auth.currentUser = freshUser;
          sessionStorage.setItem('blender_current_user', JSON.stringify(freshUser));
          localStorage.setItem('blender_current_user', JSON.stringify(freshUser));
        } else {
          Auth.clearSession();
        }
      } catch (e) {
        Auth.clearSession();
      }
    }
  },

  hashPassword: async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_blender_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  validatePassword: (password) => {
    const regex = /^(?=.*[A-Z])[A-Za-z0-9]{6,}$/;
    return regex.test(password);
  },

  login: async (email, password, mode = 'login') => {
    let users = DB.getUsers();
    let user = users.find(u => u.email === email);
    const hashedPassword = await Auth.hashPassword(password);

    if (mode === 'login') {
      if (!user) {
        Utils.showAlert('アカウントが見つかりません。新規登録してください。');
        return false;
      }
      if (user.password === hashedPassword) {
      } else if (user.password === password) {
        user.password = hashedPassword;
        DB.saveUsers(users);
      } else {
        Utils.showAlert('パスワードが間違っています。');
        return false;
      }
    } else {
      if (user) {
        Utils.showAlert('このメールアドレスは既に登録されています。ログインしてください。');
        return false;
      }
      if (!Auth.validatePassword(password)) {
        Utils.showAlert('パスワードは6文字以上で、英語と数字のみ使用可能です（記号不可）。また、大文字の英語を最低1つ含める必要があります。');
        return false;
      }

      const newUserCount = users.length + 1;
      user = {
        id: newUserCount.toString(),
        username: newUserCount.toString(),
        displayName: 'ユーザー' + newUserCount,
        email: email,
        password: hashedPassword,
        role: newUserCount === 1 ? 'admin' : 'user',
        description: '',
        avatar: '',
        isBanned: false
      };
      users.push(user);
      DB.saveUsers(users);
    }

    Auth.currentUser = user;
    sessionStorage.setItem('blender_current_user', JSON.stringify(user));
    localStorage.setItem('blender_current_user', JSON.stringify(user));
    return true;
  },

  updateSession: (updatedUser) => {
    Auth.currentUser = updatedUser;
    sessionStorage.setItem('blender_current_user', JSON.stringify(updatedUser));
    localStorage.setItem('blender_current_user', JSON.stringify(updatedUser));
  },

  clearSession: () => {
    Auth.currentUser = null;
    sessionStorage.removeItem('blender_current_user');
    localStorage.removeItem('blender_current_user');
  },

  logout: () => {
    Auth.clearSession();
    window.location.hash = '/';
  },

  isLoggedIn: () => {
    return Auth.currentUser !== null;
  },

  isAdmin: () => {
    return Auth.currentUser?.role === 'admin';
  },

  verifyAdminToken: async () => {
    if (!Auth.currentUser) return false;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const users = DB.getUsers();
      const freshUser = users.find(u => u.id === Auth.currentUser.id);
      
      if (!freshUser) throw new Error('ユーザーが存在しません');
      if (freshUser.isBanned) throw new Error('アカウントが停止されています');
      
      if (freshUser.role !== 'admin') {
        console.warn('【セキュリティ警告】不正な管理者アクセス試行が検出されました。User ID:', freshUser.id);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('トークン検証エラー:', e);
      return false;
    }
  }
};

Auth.init();
