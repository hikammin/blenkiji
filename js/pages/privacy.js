window.Pages = window.Pages || {};

Pages.Privacy = () => {
  const html = `
    ${Components.Navbar()}
    ${Components.BackButton()}
    <main class="main-content">
      <div class="container" style="max-width: 800px;">
        <div class="card">
          <h1 class="mb-8 text-center">プライバシーポリシー</h1>
          
          <div style="line-height: 1.8; color: var(--text-main);">
            <h2 style="margin-bottom: 1rem; border-bottom: 2px solid var(--primary-light); padding-bottom: 0.5rem;">1. 個人情報の収集について</h2>
            <p style="margin-bottom: 2rem;">
              本サービスでは、アカウント登録時にメールアドレス等の情報を収集します。これらの情報は、ユーザー認証および本サービスの提供、ユーザーサポートのためにのみ利用されます。
            </p>

            <h2 style="margin-bottom: 1rem; border-bottom: 2px solid var(--primary-light); padding-bottom: 0.5rem;">2. 個人情報の管理</h2>
            <p style="margin-bottom: 2rem;">
              本サービスは、ユーザーの個人情報を正確かつ最新の状態に保ち、個人情報への不正アクセス・紛失・破損・改ざん・漏洩などを防止するため、セキュリティシステムの維持・管理体制の整備等の必要な措置を講じ、安全対策を実施し個人情報の厳重な管理を行ないます。
            </p>

            <h2 style="margin-bottom: 1rem; border-bottom: 2px solid var(--primary-light); padding-bottom: 0.5rem;">3. 第三者への開示・提供の禁止</h2>
            <p style="margin-bottom: 0.5rem;">
              本サービスは、ユーザーよりお預かりした個人情報を適切に管理し、次のいずれかに該当する場合を除き、個人情報を第三者に開示いたしません。
            </p>
            <ul style="margin-bottom: 2rem; margin-left: 2rem;">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づき開示することが必要である場合</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
};
