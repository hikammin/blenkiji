document.addEventListener('DOMContentLoaded', () => {
  Router.addRoute('/', Pages.Landing);
  Router.addRoute('/home', Pages.Home);
  Router.addRoute('/articles', Pages.Articles);
  Router.addRoute('/article/:id', Pages.ArticleDetail);
  Router.addRoute('/create', Pages.ArticleCreate);
  Router.addRoute('/article-edit/:id', Pages.ArticleCreate);
  Router.addRoute('/profile', Pages.Profile);
  Router.addRoute('/user/:id', Pages.UserProfile);
  Router.addRoute('/settings', Pages.Settings);
  Router.addRoute('/notifications', Pages.Notifications);
  Router.addRoute('/tos', Pages.Tos);
  Router.addRoute('/forgot-password', Pages.ForgotPassword);
  Router.addRoute('/my-inquiries', Pages.MyInquiries);
  Router.addRoute('/privacy', Pages.Privacy);
  Router.addRoute('/admin', Pages.Admin);

  Router.init();

  setTimeout(() => {
    const loading = document.querySelector('.loading-screen');
    if (loading) {
      loading.classList.add('hidden');
    }
  }, 500);
});
