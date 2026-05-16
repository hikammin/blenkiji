window.Pages = window.Pages || {};

Pages.ForgotPassword = () => {
  let step = 1;
  let targetEmail = '';

  window.handleResetSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      const email = document.getElementById('reset-email').value;
      const users = DB.getUsers();
      const user = users.find(u => u.email === email);
      if (user) {
        targetEmail = email;
        step = 2;
        Utils.showAlert('本人確認が完了しました。（※デモ版のため、メール送信を省略して直接再設定画面に移行します）\n新しいパスワードを入力してください。');
        Pages.ForgotPassword();
      } else {
        Utils.showAlert('このメールアドレスは登録されていません。');
      }
    } else if (step === 2) {
      const newPassword = document.getElementById('new-password').value;
      if (!Auth.validatePassword(newPassword)) {
        Utils.showAlert('パスワードは6文字以上で、英語と数字のみ使用可能です（記号不可）。また、大文字の英語を最低1つ含める必要があります。');
        return;
      }
      const users = DB.getUsers();
      const idx = users.findIndex(u => u.email === targetEmail);
      if (idx !== -1) {
        users[idx].password = await Auth.hashPassword(newPassword);
        DB.saveUsers(users);
        Utils.showAlert('パスワードをリセットしました。新しいパスワードでログインしてください。');
        window.location.hash = '/';
      }
    }
  };

  let formHtml = '';
  if (step === 1) {
    formHtml = `
      <p class="text-center mb-4" style="color: var(--text-muted); font-size: 0.9rem;">
        登録しているメールアドレスを入力してください。<br>パスワードリセットのご案内を送信します。
      </p>
      <div class="form-group">
        <label class="form-label" for="reset-email">メールアドレス</label>
        <input type="email" id="reset-email" class="form-control" required>
      </div>
      <button type="submit" class="btn btn-primary w-100">パスワードをリセットする</button>
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
            <a href="#/" style="font-size: 0.85rem; color: var(--text-muted);">ログイン画面に戻る</a>
          </div>
        </div>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
};
