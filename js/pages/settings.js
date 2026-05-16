window.Pages = window.Pages || {};

Pages.Settings = () => {
  const user = Auth.currentUser;

  const readImage = (file) => {
    return new Promise((resolve) => {
      if (!file) {
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  };

  window.handleProfileUpdate = async (e) => {
    e.preventDefault();
    const displayName = document.getElementById('displayName').value;
    const description = document.getElementById('description').value;
    const avatarInput = document.getElementById('avatar').files[0];
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerText = '保存中...';
    submitBtn.disabled = true;

    let avatar = user.avatar;
    if (avatarInput) {
      avatar = await readImage(avatarInput);
    }

    const updatedUser = DB.updateUser(user.id, {
      displayName,
      description,
      avatar
    });

    if (updatedUser) {
      Auth.updateSession(updatedUser);
      Utils.showAlert('プロフィールを更新しました。');
      window.location.hash = '/profile';
    }
  };

  const avatarHtml = user.avatar 
      ? `<img src="${user.avatar}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">`
      : `<div style="width: 100px; height: 100px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2.5rem; font-weight: bold;">${(user.displayName || user.username).charAt(0).toUpperCase()}</div>`;

  const html = `
    ${Components.Navbar()}
    ${Components.BackButton()}
    <main class="main-content">
      <div class="container" style="max-width: 600px;">
        <h1 class="mb-8">プロフィール設定</h1>
        
        <div class="card mb-8">
          <form onsubmit="handleProfileUpdate(event)">
            
            <div class="mb-8" style="text-align: center;">
              <div style="margin-bottom: 1rem; display: flex; justify-content: center;">
                ${avatarHtml}
              </div>
              <div class="form-group">
                <label class="form-label">プロファイルアイコンを変更</label>
                <input type="file" id="avatar" accept="image/*" style="display:none;" onchange="(function(input){ var label = input.closest('.form-group').querySelector('.upload-text'); if (input.files.length > 0) { label.innerHTML = '<span class=\'file-name\'>📎 ' + input.files[0].name + '</span>'; } else { label.innerHTML = 'クリックして画像を選択'; } })(this)">
                <div class="custom-file-upload" onclick="document.getElementById('avatar').click()">
                  <span class="upload-icon">📷</span>
                  <span class="upload-text">クリックして画像を選択</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">ユーザー名（ID）</label>
              <input type="text" class="form-control" value="${user.username}" disabled style="background: var(--bg-color); cursor: not-allowed;">
              <small style="color: var(--text-muted); display: block; margin-top: 0.5rem;">※ユーザー名（何人目の登録者かを示すID）は変更できません。</small>
            </div>

            <div class="form-group">
              <label class="form-label" for="displayName">表示名（名前）</label>
              <input type="text" id="displayName" class="form-control" value="${Utils.escapeHtml(user.displayName || '')}" required>
            </div>

            <div class="form-group mb-8">
              <label class="form-label" for="description">自己紹介 / 説明</label>
              <textarea id="description" class="form-control" rows="4" placeholder="Blenderの得意なモデリングや、ポートフォリオへのリンクなど">${Utils.escapeHtml(user.description || '')}</textarea>
            </div>

            <div class="text-center">
              <button type="submit" id="submit-btn" class="btn btn-primary" style="font-size: 1.1rem; padding: 0.75rem 2rem;">変更を保存</button>
            </div>

          </form>
        </div>

        <div class="card text-center" style="padding: 2rem;">
          <h2 style="font-size: 1.25rem; margin-bottom: 1rem;">お問い合わせ履歴</h2>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.95rem;">過去に送信したお問い合わせと、管理者からの返信内容を確認できます。</p>
          <a href="#/my-inquiries" class="btn btn-outline">お問い合わせ履歴を見る</a>
        </div>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
};
