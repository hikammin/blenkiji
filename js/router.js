const Router = {
  routes: {},
  PUBLIC_PATHS: ['/', '/tos', '/privacy', '/forgot-password'],

  addRoute: (path, pageFunction) => {
    Router.routes[path] = pageFunction;
  },

  navigate: () => {
    let path = window.location.hash.slice(1) || '/';
    const cleanPath = path.split('#')[0].split('?')[0];
    
    if (!Auth.isLoggedIn() && !Router.PUBLIC_PATHS.includes(cleanPath)) {
      Utils.showAlert('この記事やページを見るにはログインが必要です。');
      window.location.hash = '/';
      return;
    }
    if (Auth.isLoggedIn() && path === '/') {
      window.location.hash = '/home';
      return;
    }

    if (path.startsWith('/article/')) {
      const id = path.split('/')[2];
      if (Router.routes['/article/:id']) {
        Router.routes['/article/:id'](id);
        return;
      }
    }

    if (path.startsWith('/article-edit/')) {
      const id = path.split('/')[2];
      if (Router.routes['/article-edit/:id']) {
        Router.routes['/article-edit/:id'](id);
        return;
      }
    }

    if (path.startsWith('/user/')) {
      const id = path.split('/')[2];
      if (Router.routes['/user/:id']) {
        Router.routes['/user/:id'](id);
        return;
      }
    }

    const pageFunc = Router.routes[cleanPath];
    if (pageFunc) {
      pageFunc();
    } else {
      const html = `
        ${window.Components && Components.Navbar ? Components.Navbar() : ''}
        <main class="main-content" style="display:flex; align-items:center; justify-content:center; min-height:60vh;">
          <div class="text-center">
            <h1 style="font-size: 6rem; color: var(--primary-light); margin-bottom: 1rem; font-weight: 800;">404</h1>
            <h2 style="margin-bottom: 2rem; color: var(--text-main);">ページが見つかりません</h2>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">お探しのページは削除されたか、URLが間違っている可能性があります。</p>
            <a href="#/home" class="btn btn-primary">ホームに戻る</a>
          </div>
        </main>
      `;
      Utils.renderContent('app', html);
    }
  },

  init: () => {
    window.addEventListener('hashchange', Router.navigate);
    Router.navigate();
  }
};
