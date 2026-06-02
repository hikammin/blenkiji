window.supabaseClient = null;

const Auth = {
  currentUser: null,

  init: () => {
    // Supabaseの初期化チェック
    if (window.supabase && window.ENV && window.ENV.SUPABASE_URL && window.ENV.SUPABASE_ANON_KEY) {
      const url = window.ENV.SUPABASE_URL;
      const key = window.ENV.SUPABASE_ANON_KEY;
      if (url && url.startsWith('http') && key && key.length > 20) {
        try {
          window.supabaseClient = window.supabase.createClient(url, key);
          
          // Supabase のセッション監視
          window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (session && session.user) {
              const users = DB.getUsers();
              let freshUser = users.find(u => u.id === session.user.id);
              if (!freshUser) {
                // SQLトリガーで public.users に自動登録される設計ですが、
                // ローカルストレージ側の擬似DB（DB.getUsers）にも同期させておきます。
                freshUser = {
                  id: session.user.id,
                  username: session.user.email.split('@')[0],
                  displayName: session.user.user_metadata?.displayName || 'ユーザー_' + session.user.id.substring(0, 4),
                  email: session.user.email,
                  role: session.user.email === window.ENV.ADMIN_EMAIL ? 'admin' : 'user',
                  description: 'Supabaseからログイン中',
                  avatar: '',
                  isBanned: false,
                  followers: [],
                  following: []
                };
                users.push(freshUser);
                DB.saveUsers(users);
              }
              Auth.currentUser = freshUser;
              sessionStorage.setItem('blender_current_user', JSON.stringify(freshUser));
              localStorage.setItem('blender_current_user', JSON.stringify(freshUser));
            } else {
              Auth.clearSession();
            }
          });
          return;
        } catch (err) {
          console.error("Supabase Client Initialization Error:", err);
        }
      }
    }

    // 従来のローカルストレージベースの復元
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
    // 1. Supabase Auth がセットアップされている場合
    if (window.supabaseClient) {
      if (mode === 'login') {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            Utils.showAlert('メールアドレスの確認が完了していません。メールボックスに届いた確認メールのリンクをクリックしてください。');
          } else {
            Utils.showAlert('ログインに失敗しました: ' + error.message);
          }
          return false;
        }
        
        // セッション同期により Auth.currentUser は自動更新されます
        return true;
      } else {
        // 新規登録 (SignUp)
        if (!Auth.validatePassword(password)) {
          Utils.showAlert('パスワードは6文字以上で、英語と数字のみ使用可能です（記号不可）。また、大文字の英語を最低1つ含める必要があります。');
          return false;
        }

        const { data, error } = await window.supabaseClient.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              displayName: 'ユーザー_' + Math.floor(100 + Math.random() * 900)
            }
          }
        });

        if (error) {
          Utils.showAlert('新規登録に失敗しました: ' + error.message);
          return false;
        }

        Utils.showAlert('アカウント登録の案内メールを送信しました！\nメールボックスをご確認いただき、メール内の確認リンクをクリックしてアカウントを有効化してください。\n\n※メールが見つからない場合は、迷惑メールフォルダ（スパム）もご確認ください。');
        return true;
      }
    }

    // 2. 従来の疑似（ローカル）認証ロジック (Supabaseキー未設定時のデモ用)
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

      Auth.currentUser = user;
      sessionStorage.setItem('blender_current_user', JSON.stringify(user));
      localStorage.setItem('blender_current_user', JSON.stringify(user));
      return true;
    } else {
      if (user) {
        Utils.showAlert('このメールアドレスは既に登録されています。ログインしてください。');
        return false;
      }
      if (!Auth.validatePassword(password)) {
        Utils.showAlert('パスワードは6文字以上で、英語と数字のみ使用可能です（記号不可）。また、大文字の英語を最低1つ含める必要があります。');
        return false;
      }

      // 新規登録の確認メール送信シミュレーション
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      Utils.showMockEmail(
        email,
        "【Blender記事市場】新規会員登録の確認コード",
        `Blender記事市場へようこそ！\n\nアカウントの新規作成を完了するには、下記の確認コードを登録画面に入力してください。\n\n確認コード: ${verificationCode}\n\n※このコードの有効期限は10分間です。`
      );

      return new Promise((resolve) => {
        const existingModal = document.getElementById('signup-verification-modal');
        if (existingModal) existingModal.remove();

        const overlay = document.createElement('div');
        overlay.id = 'signup-verification-modal';
        overlay.style.cssText = `
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease-out;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
          background: var(--bg-card);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-glass);
          color: var(--text-main);
          padding: 2.5rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          width: 90%;
          max-width: 400px;
          text-align: center;
          transform: scale(0.95);
          animation: modalPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.15) forwards;
        `;

        modal.innerHTML = `
          <h3 style="margin: 0 0 1rem 0; font-size: 1.25rem; font-weight: 700; color: var(--text-main);">メールアドレスの確認</h3>
          <p style="margin: 0 0 1.5rem 0; font-size: 0.9rem; line-height: 1.5; color: var(--text-muted); text-align: left;">
            入力されたメールアドレス (${Utils.escapeHtml(email)}) 宛てに確認メールを送信しました。<br>
            画面右下のメール受信シミュレータに届いた6桁の確認コードを入力してください。
          </p>
          <div class="form-group" style="margin-bottom: 1.5rem;">
            <input type="text" id="verification-input" class="form-control" placeholder="6桁のコード" style="text-align: center; font-size: 1.5rem; letter-spacing: 0.2rem; font-weight: bold; font-family: var(--font-mono);" maxlength="6" required>
          </div>
          <div style="display: flex; gap: 1rem;">
            <button id="verification-cancel-btn" class="btn btn-outline" style="flex: 1; padding: 0.6rem;">キャンセル</button>
            <button id="verification-confirm-btn" class="btn btn-primary" style="flex: 1; padding: 0.6rem;">認証する</button>
          </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const cancelBtn = modal.querySelector('#verification-cancel-btn');
        const confirmBtn = modal.querySelector('#verification-confirm-btn');
        const inputEl = modal.querySelector('#verification-input');

        cancelBtn.onclick = () => {
          overlay.remove();
          resolve(false);
        };

        confirmBtn.onclick = () => {
          const codeInput = inputEl.value.trim();
          if (codeInput === verificationCode) {
            overlay.remove();
            
            // ユーザー登録の実行
            const newUserCount = users.length + 1;
            const newUser = {
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
            users.push(newUser);
            DB.saveUsers(users);

            Auth.currentUser = newUser;
            sessionStorage.setItem('blender_current_user', JSON.stringify(newUser));
            localStorage.setItem('blender_current_user', JSON.stringify(newUser));
            
            Utils.showAlert('登録が完了しました！');
            resolve(true);
          } else {
            Utils.showAlert('確認コードが一致しません。もう一度お確かめください。');
          }
        };

        overlay.onclick = (e) => {
          if (e.target === overlay) {
            overlay.remove();
            resolve(false);
          }
        };
      });
    }
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

  logout: async () => {
    if (window.supabaseClient) {
      await window.supabaseClient.auth.signOut();
    }
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
