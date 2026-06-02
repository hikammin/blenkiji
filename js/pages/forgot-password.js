window.Pages = window.Pages || {};

Pages.ForgotPassword = () => {
  // Supabaseが有効で、URLにリセット用トークンが含まれているかチェック
  const hash = window.location.hash;
  const isRecovery = hash.includes('type=recovery') || hash.includes('access_token=') || hash.includes('error=');
  
  if (Pages._resetStep === undefined) {
    Pages._resetStep = 1;
    Pages._resetEmail = '';
    Pages._resetCode = '';
  }

  // Supabaseセッションかつリカバリーモードの場合は強制的にステップ3（新パスワード入力）にする
  if (isRecovery && window.supabaseClient) {
    if (hash.includes('error=')) {
      // エラー引数を解析
      const errorMsg = hash.split('error_description=')[1]?.split('&')[0] || '無効なリセットリンクです';
      Utils.showAlert('パスワードリセットリンクのエラー: ' + decodeURIComponent(errorMsg.replace(/\+/g, ' ')));
      window.location.hash = '/';
      Pages._resetStep = 1;
      return;
    }
    Pages._resetStep = 3;
  }

  window.handleResetSubmit = async (e) => {
    e.preventDefault();

    // 1. Supabase Auth がセットアップされている場合
    if (window.supabaseClient) {
      if (Pages._resetStep === 1) {
        const email = document.getElementById('reset-email').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerText = '送信中...';
        submitBtn.disabled = true;

        const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + window.location.pathname + '#/forgot-password'
        });

        submitBtn.innerText = '確認メールを送信する';
        submitBtn.disabled = false;

        if (error) {
          Utils.showAlert('パスワード再設定メールの送信に失敗しました: ' + error.message);
          return;
        }

        Pages._resetEmail = email;
        Utils.showAlert('パスワード再設定メールを送信しました！\nメールボックスをご確認いただき、メール内の再設定リンクをクリックして手続きを完了してください。\n\n※メールが見つからない場合は、迷惑メールフォルダ（スパム）もご確認ください。');
      } else if (Pages._resetStep === 3) {
        const newPassword = document.getElementById('new-password').value;
        if (!Auth.validatePassword(newPassword)) {
          Utils.showAlert('パスワードは6文字以上で、英語と数字のみ使用可能です（記号不可）。また、大文字の英語を最低1つ含める必要があります。');
          return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerText = '再設定中...';
        submitBtn.disabled = true;

        const { data, error } = await window.supabaseClient.auth.updateUser({
          password: newPassword
        });

        submitBtn.innerText = 'パスワードを再設定する';
        submitBtn.disabled = false;

        if (error) {
          Utils.showAlert('パスワードの再設定に失敗しました: ' + error.message);
          return;
        }

        // 状態のクリアとサインアウト
        await window.supabaseClient.auth.signOut();
        Pages._resetStep = 1;
        Pages._resetEmail = '';
        Pages._resetCode = '';

        // ハッシュからアクセストークン等を除去してクリーンに遷移する
        window.location.hash = '/';
        setTimeout(() => {
          Utils.showAlert('パスワードのリセットが完了しました！新しいパスワードでログインしてください。');
        }, 100);
      }
      return;
    }

    // 2. 従来の疑似（ローカル）リセットロジック (Supabaseキー未設定時のデモ用)
    if (Pages._resetStep === 1) {
      const email = document.getElementById('reset-email').value;
      const users = DB.getUsers();
      const user = users.find(u => u.email === email);
      if (user) {
        Pages._resetEmail = email;
        Pages._resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        Pages._resetStep = 2;

        // 疑似メール送信
        Utils.showMockEmail(
          email,
          "【Blender記事市場】パスワード再設定の確認コード",
          `Blender記事市場をご利用いただきありがとうございます。\n\nパスワードの再設定リクエストがありました。\nアカウント確認を完了するには、下記の確認コードを入力してください。\n\n確認コード: ${Pages._resetCode}\n\n心当たりがない場合は、このメールを無視してください。`
        );

        Utils.showAlert('パスワード再設定用の確認メールを送信しました。\n画面右下のメール受信シミュレータをご確認ください。');
        Pages.ForgotPassword();
      } else {
        Utils.showAlert('このメールアドレスは登録されていません。');
      }
    } else if (Pages._resetStep === 2) {
      const codeInput = document.getElementById('reset-code').value.trim();
      if (codeInput === Pages._resetCode) {
        Pages._resetStep = 3;
        Utils.showAlert('本人確認が完了しました。\n新しいパスワードを入力してください。');
        Pages.ForgotPassword();
      } else {
        Utils.showAlert('確認コードが一致しません。もう一度お確かめください。');
      }
    } else if (Pages._resetStep === 3) {
      const newPassword = document.getElementById('new-password').value;
      if (!Auth.validatePassword(newPassword)) {
        Utils.showAlert('パスワードは6文字以上で、英語と数字のみ使用可能です（記号不可）。また、大文字の英語を最低1つ含める必要があります。');
        return;
      }
      const users = DB.getUsers();
      const idx = users.findIndex(u => u.email === Pages._resetEmail);
      if (idx !== -1) {
        users[idx].password = await Auth.hashPassword(newPassword);
        DB.saveUsers(users);
        
        // 状態をクリア
        Pages._resetStep = 1;
        Pages._resetEmail = '';
        Pages._resetCode = '';

        Utils.showAlert('パスワードをリセットしました。新しいパスワードでログインしてください。');
        window.location.hash = '/';
      }
    }
  };

  let formHtml = '';
  if (Pages._resetStep === 1) {
    formHtml = `
      <p class="text-center mb-4" style="color: var(--text-muted); font-size: 0.9rem;">
        登録しているメールアドレスを入力してください。<br>パスワードリセットのご案内を送信します。
      </p>
      <div class="form-group">
        <label class="form-label" for="reset-email">メールアドレス</label>
        <input type="email" id="reset-email" class="form-control" required>
      </div>
      <button type="submit" class="btn btn-primary w-100">確認メールを送信する</button>
    `;
  } else if (Pages._resetStep === 2) {
    formHtml = `
      <p class="text-center mb-4" style="color: var(--text-muted); font-size: 0.9rem;">
        ${Utils.escapeHtml(Pages._resetEmail)} 宛てに確認メールを送信しました。<br>
        メール受信シミュレータに届いた6桁の確認コードを入力してください。
      </p>
      <div class="form-group">
        <label class="form-label" for="reset-code">確認コード</label>
        <input type="text" id="reset-code" class="form-control" required maxlength="6" style="text-align: center; font-size: 1.3rem; letter-spacing: 0.2rem; font-weight: bold; font-family: var(--font-mono);">
      </div>
      <button type="submit" class="btn btn-primary w-100">コードを認証する</button>
    `;
  } else {
    formHtml = `
      <p class="text-center mb-4" style="color: var(--text-muted); font-size: 0.9rem;">
        新しいパスワードを入力してください。<br>（大文字を含む英数字6文字以上・記号不可）
      </p>
      <div class="form-group">
        <label class="form-label" for="new-password">新しいパスワード</label>
        <input type="password" id="new-password" class="form-control" required minlength="6">
      </div>
      <button type="submit" class="btn btn-primary w-100">パスワードを再設定する</button>
    `;
  }

  const html = `
    ${Components.Navbar ? Components.Navbar() : ''}
    ${Components.BackButton ? Components.BackButton() : ''}
    <main class="main-content">
      <div class="container" style="max-width: 400px; padding-top: 4rem;">
        <div class="card">
          <h2 class="text-center mb-4">パスワードのリセット</h2>
          <form onsubmit="handleResetSubmit(event)">
            ${formHtml}
          </form>
          <div class="text-center mt-4">
            <a href="#/" onclick="Pages._resetStep = 1; Pages._resetEmail = ''; Pages._resetCode = '';" style="font-size: 0.85rem; color: var(--text-muted);">ログイン画面に戻る</a>
          </div>
        </div>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
};
