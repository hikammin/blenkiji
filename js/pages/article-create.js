window.Pages = window.Pages || {};

Pages.ArticleCreate = (editId) => {
  if (Auth.currentUser && Auth.currentUser.isBanned) {
    Utils.renderContent('app', `
      ${Components.Navbar()}
      <main class="main-content">
        <div class="container" style="max-width: 600px; text-align: center; padding-top: 4rem;">
          <div class="card" style="padding: 3rem;">
            <h2 style="color: var(--danger); margin-bottom: 1rem;">🚫 記事投稿が禁止されています</h2>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">管理者によりあなたのアカウントは記事投稿が制限されています。<br>心当たりがない場合は、お問い合わせフォームよりご連絡ください。</p>
            <a href="#/home" class="btn btn-primary">ホームに戻る</a>
          </div>
        </div>
      </main>
    `);
    return;
  }

  const isEdit = !!editId;
  const articleToEdit = isEdit ? DB.getArticleById(editId) : null;
  let stepsCount = isEdit ? articleToEdit.steps.length : 1;
  const readAndResizeImage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve('');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        Utils.showAlert('画像サイズは2MB以下にしてください。自動リサイズを試みますが、元画像が大きすぎると失敗する可能性があります。');
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1200;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/webp', 0.8);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
      reader.readAsDataURL(file);
    });
  };

  window.saveDraft = () => {
    const title = document.getElementById('title')?.value || '';
    const description = document.getElementById('description')?.value || '';
    localStorage.setItem('article_draft', JSON.stringify({ title, description }));
  };

  const loadDraft = () => {
    const draft = localStorage.getItem('article_draft');
    if (draft) {
      const { title, description } = JSON.parse(draft);
      if (title) document.getElementById('title').value = title;
      if (description) document.getElementById('description').value = description;
    }
  };

  window.triggerFileInput = (inputId) => {
    document.getElementById(inputId).click();
  };

  window.onFileSelected = (input) => {
    const label = input.closest('.form-group').querySelector('.upload-text');
    if (input.files.length > 0) {
      label.innerHTML = `<span class="file-name">📎 ${Utils.escapeHtml(input.files[0].name)}</span>`;
    } else {
      label.innerHTML = 'クリックして画像を選択';
    }
  };

  window.addStep = () => {
    stepsCount++;
    const container = document.getElementById('steps-container');
    const stepHtml = `
      <div class="card mb-4 step-item" id="step-${stepsCount}">
        <h3 class="mb-4">${stepsCount}.</h3>
        <div class="form-group">
          <label class="form-label">セクションのタイトル</label>
          <input type="text" class="form-control step-title" placeholder="（例）オブジェクトの追加">
        </div>
        <div class="form-group">
          <label class="form-label">画像</label>
          <input type="file" id="step-image-${stepsCount}" class="step-image" accept="image/*" style="display:none;" onchange="onFileSelected(this)">
          <div class="custom-file-upload" onclick="triggerFileInput('step-image-${stepsCount}')">
            <span class="upload-icon">📁</span>
            <span class="upload-text">クリックして画像を選択</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">説明テキスト</label>
          <textarea class="form-control step-text" rows="3" required></textarea>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', stepHtml);
  };

  window.handleCreateSubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;

    if (title.length > 30) {
      Utils.showAlert('タイトルは30文字以内で入力してください。');
      return;
    }
    if (description.length > 1000) {
      Utils.showAlert('概要は1000文字以内で入力してください。');
      return;
    }

    const thumbInput = document.getElementById('thumbnail').files[0];
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerText = '作成中...';
    submitBtn.disabled = true;

    try {
      const thumbnail = thumbInput ? await readAndResizeImage(thumbInput) : (isEdit ? articleToEdit.thumbnail : '');
      const selectedTags = Array.from(document.querySelectorAll('input[name="article-tags"]:checked')).map(cb => cb.value);
      
      const stepElements = document.querySelectorAll('.step-item');
      const steps = [];
      
      for (let i = 0; i < stepElements.length; i++) {
        const el = stepElements[i];
        const stepTitle = el.querySelector('.step-title').value;
        const text = el.querySelector('.step-text').value;
        const imgFile = el.querySelector('.step-image').files[0];
        const image = imgFile ? await readAndResizeImage(imgFile) : (isEdit && articleToEdit.steps[i] ? articleToEdit.steps[i].image : '');
        
        steps.push({
          id: i + 1,
          title: stepTitle,
          text,
          image
        });
      }

      let resultArticle;
      if (isEdit) {
        resultArticle = DB.updateArticle(editId, {
          title,
          description,
          thumbnail,
          tags: selectedTags,
          steps
        });
      } else {
        resultArticle = DB.addArticle({
          title,
          description,
          thumbnail,
          authorId: Auth.currentUser.id,
          authorName: Auth.currentUser.displayName || Auth.currentUser.username,
          tags: selectedTags,
          isPublic: true,
          isFeatured: false,
          steps
        });
      }

      localStorage.removeItem('article_draft');
      window.location.hash = '/article/' + resultArticle.id;
    } catch (error) {
      Utils.showAlert('エラーが発生しました: ' + error.message);
      submitBtn.innerText = isEdit ? '記事を更新する' : '記事を公開する';
      submitBtn.disabled = false;
    }
  };

  const html = `
    ${Components.Navbar()}
    ${Components.BackButton()}
    <main class="main-content">
      <div class="container" style="max-width: 800px;">
        <h1 class="mb-8">${isEdit ? '記事を編集' : '記事を作成'}</h1>
        
        <form id="create-form" onsubmit="handleCreateSubmit(event)">
          <div class="card mb-8">
            <h2 class="mb-4">基本情報</h2>
            <div class="form-group">
              <label class="form-label" for="title">タイトル <span style="color:var(--text-muted);font-size:0.85rem;">(最大30文字)</span></label>
              <input type="text" id="title" class="form-control" maxlength="30" required oninput="saveDraft()" value="${isEdit ? Utils.escapeHtml(articleToEdit.title) : ''}">
            </div>
            <div class="form-group">
              <label class="form-label">サムネイル画像 <span style="color:var(--text-muted);font-size:0.85rem;">(自動リサイズされます)</span></label>
              <input type="file" id="thumbnail" accept="image/*" style="display:none;" onchange="onFileSelected(this)">
              <div class="custom-file-upload" onclick="triggerFileInput('thumbnail')">
                <span class="upload-icon">🖼️</span>
                <span class="upload-text">クリックして画像を選択</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="description">概要</label>
              <textarea id="description" class="form-control" rows="3" maxlength="1000" required oninput="saveDraft()">${isEdit ? Utils.escapeHtml(articleToEdit.description) : ''}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">タグ (複数選択可)</label>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;" id="tags-container">
                <label style="cursor: pointer; display: inline-flex; align-items: center; background: rgba(0,0,0,0.3); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-glass); white-space: nowrap;"><input type="checkbox" name="article-tags" value="モデリング" style="margin-right: 0.5rem;">モデリング</label>
                <label style="cursor: pointer; display: inline-flex; align-items: center; background: rgba(0,0,0,0.3); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-glass); white-space: nowrap;"><input type="checkbox" name="article-tags" value="スカルプト" style="margin-right: 0.5rem;">スカルプト</label>
                <label style="cursor: pointer; display: inline-flex; align-items: center; background: rgba(0,0,0,0.3); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-glass); white-space: nowrap;"><input type="checkbox" name="article-tags" value="テクスチャ" style="margin-right: 0.5rem;">テクスチャ</label>
                <label style="cursor: pointer; display: inline-flex; align-items: center; background: rgba(0,0,0,0.3); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-glass); white-space: nowrap;"><input type="checkbox" name="article-tags" value="アニメーション" style="margin-right: 0.5rem;">アニメーション</label>
                <label style="cursor: pointer; display: inline-flex; align-items: center; background: rgba(0,0,0,0.3); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-glass); white-space: nowrap;"><input type="checkbox" name="article-tags" value="Geometry Nodes" style="margin-right: 0.5rem;">Geometry Nodes</label>
                <label style="cursor: pointer; display: inline-flex; align-items: center; background: rgba(0,0,0,0.3); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-glass); white-space: nowrap;"><input type="checkbox" name="article-tags" value="リギング" style="margin-right: 0.5rem;">リギング</label>
                <label style="cursor: pointer; display: inline-flex; align-items: center; background: rgba(0,0,0,0.3); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-glass); white-space: nowrap;"><input type="checkbox" name="article-tags" value="レンダリング" style="margin-right: 0.5rem;">レンダリング</label>
                <label style="cursor: pointer; display: inline-flex; align-items: center; background: rgba(0,0,0,0.3); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-glass); white-space: nowrap;"><input type="checkbox" name="article-tags" value="アドオン" style="margin-right: 0.5rem;">アドオン</label>
                <label style="cursor: pointer; display: inline-flex; align-items: center; background: rgba(0,0,0,0.3); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-glass); white-space: nowrap;"><input type="checkbox" name="article-tags" value="初心者向け" style="margin-right: 0.5rem;">初心者向け</label>
              </div>
            </div>
          </div>

          <div id="steps-container">
            <h2 class="mb-4">コンテンツ</h2>
            ${(isEdit ? articleToEdit.steps : [{ id: 1, title: '', text: '', image: '' }]).map((step, idx) => `
              <div class="card mb-4 step-item" id="step-${idx + 1}">
                <h3 class="mb-4">${idx + 1}.</h3>
                <div class="form-group">
                  <label class="form-label">セクションのタイトル</label>
                  <input type="text" class="form-control step-title" placeholder="（例）オブジェクトの追加" value="${Utils.escapeHtml(step.title || '')}">
                </div>
                <div class="form-group">
                  <label class="form-label">画像 ${step.image ? '<span style="color:var(--primary); font-size:0.8rem;">(画像あり)</span>' : ''}</label>
                  <input type="file" id="step-image-${idx + 1}" class="step-image" accept="image/*" style="display:none;" onchange="onFileSelected(this)">
                  <div class="custom-file-upload" onclick="triggerFileInput('step-image-${idx + 1}')">
                    <span class="upload-icon">📁</span>
                    <span class="upload-text">クリックして画像を変更</span>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">説明テキスト</label>
                  <textarea class="form-control step-text" rows="3" required>${Utils.escapeHtml(step.text || '')}</textarea>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="flex gap-4 mb-8">
            <button type="button" onclick="addStep()" class="btn btn-outline" style="flex: 1;">+ セクションを追加</button>
          </div>

          <div class="card text-center mb-8">
            <button type="submit" id="submit-btn" class="btn btn-primary" style="font-size: 1.1rem; padding: 1rem 2rem;">${isEdit ? '記事を更新する' : '記事を公開する'}</button>
          </div>
        </form>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
  
  setTimeout(() => {
    if (isEdit) {
      if (articleToEdit.tags) {
        articleToEdit.tags.forEach(tag => {
          const cb = document.querySelector(`input[name="article-tags"][value="${tag}"]`);
          if (cb) cb.checked = true;
        });
      }
    } else {
      loadDraft();
    }
  }, 0);
};
