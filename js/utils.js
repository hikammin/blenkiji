const Utils = {
  formatDate: (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('ja-JP', options);
  },

  escapeHtml: (unsafe) => {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  },

  parseMarkdown: (text) => {
    if (!text) return '';
    let html = Utils.escapeHtml(text);
    html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:0.2rem 0.4rem;border-radius:4px;color:var(--primary-light);font-family:var(--font-mono);font-weight:600;">$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return html;
  },

  setOGPTags: (title, description, image) => {
    const setMeta = (property, content) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    setMeta('og:title', title || 'Blender記事市場');
    setMeta('og:description', description || 'Blenderユーザーが制作工程を共有するコミュニティ');
    if (image) setMeta('og:image', image);
  },

  renderContent: (containerId, html) => {
    const container = document.getElementById(containerId);
    if (container) {
      const footer = typeof Components !== 'undefined' && Components.Footer ? Components.Footer() : '';
      container.innerHTML = html + footer;
    }
    if (!window.location.hash.includes('#contact')) {
      window.scrollTo(0, 0);
    } else {
      setTimeout(() => {
        const contactEl = document.getElementById('contact');
        if (contactEl) {
          contactEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    }
  },

  showAlert: (message) => {
    const existingAlert = document.getElementById('custom-alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'custom-alert';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
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
      color: var(--text-main);
      padding: 2rem 3rem;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      text-align: center;
      min-width: 320px;
      max-width: 90%;
      transform: translateY(20px);
      animation: slideUp 0.3s ease-out forwards;
      border: 1px solid var(--border-glass);
    `;

    const text = document.createElement('p');
    text.style.cssText = `
      margin: 0 0 1.5rem 0;
      font-size: 1.1rem;
      line-height: 1.5;
    `;
    text.textContent = message;

    const btn = document.createElement('button');
    btn.textContent = 'OK';
    btn.style.cssText = `
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.6rem 2rem;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.2s, transform 0.1s;
    `;
    btn.onmouseover = () => btn.style.background = 'var(--primary-light)';
    btn.onmouseout = () => btn.style.background = 'var(--primary)';
    btn.onmousedown = () => btn.style.transform = 'scale(0.95)';
    btn.onmouseup = () => btn.style.transform = 'scale(1)';
    btn.onclick = () => overlay.remove();

    modal.appendChild(text);
    modal.appendChild(btn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    if (!document.getElementById('custom-alert-styles')) {
      const style = document.createElement('style');
      style.id = 'custom-alert-styles';
      style.textContent = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `;
      document.head.appendChild(style);
    }
  },

  showUserListModal: (title, userIds) => {
    const existingModal = document.getElementById('user-list-modal');
    if (existingModal) existingModal.remove();

    const users = typeof DB !== 'undefined' ? DB.getUsers() : [];
    const targetUsers = userIds.map(id => users.find(u => u.id === id)).filter(Boolean);

    const overlay = document.createElement('div');
    overlay.id = 'user-list-modal';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
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
      padding: 2rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      width: 90%;
      max-width: 400px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      transform: scale(0.95);
      animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    `;

    const header = document.createElement('div');
    header.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-glass); padding-bottom: 0.5rem;`;
    header.innerHTML = `<h3 style="margin: 0; font-size: 1.2rem;">${Utils.escapeHtml(title)}</h3><button style="font-size: 1.5rem; line-height: 1; color: var(--text-muted); background: none; border: none; cursor: pointer;" onclick="document.getElementById('user-list-modal').remove()">&times;</button>`;

    const listContainer = document.createElement('div');
    listContainer.style.cssText = `overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 1rem;`;

    if (targetUsers.length === 0) {
      listContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin: 2rem 0;">ユーザーが見つかりません。</p>`;
    } else {
      targetUsers.forEach(u => {
        const item = document.createElement('div');
        item.style.cssText = `display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.5rem; border-radius: var(--radius); transition: background 0.2s;`;
        item.onmouseover = () => item.style.background = 'var(--bg-color)';
        item.onmouseout = () => item.style.background = 'transparent';
        item.onclick = () => {
          overlay.remove();
          window.location.hash = `/user/${u.id}`;
        };

        const display = u.displayName || 'ユーザー' + u.username;
        const avatar = u.avatar 
          ? `<img src="${u.avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`
          : `<div style="width: 40px; height: 40px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${display.charAt(0).toUpperCase()}</div>`;
        
        item.innerHTML = `
          ${avatar}
          <div style="flex: 1; overflow: hidden;">
            <div style="font-weight: 500; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${Utils.escapeHtml(display)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">@${Utils.escapeHtml(u.username)}</div>
          </div>
        `;
        listContainer.appendChild(item);
      });
    }

    modal.appendChild(header);
    modal.appendChild(listContainer);
    overlay.appendChild(modal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);

    if (!document.getElementById('modal-styles')) {
      const style = document.createElement('style');
      style.id = 'modal-styles';
      style.textContent = `
        @keyframes modalPop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `;
      document.head.appendChild(style);
    }
  }
};
