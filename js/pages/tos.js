window.Pages = window.Pages || {};

Pages.Tos = () => {
  const html = `
    ${Components.Navbar()}
    ${Components.BackButton()}
    <main class="main-content">
      <div class="container" style="max-width: 800px;">
        <div class="card">
          <h1 class="mb-8 text-center">利用規約</h1>
          
          <div style="line-height: 1.8; color: var(--text-main);">
            <h2 style="margin-bottom: 1rem; border-bottom: 2px solid var(--primary-light); padding-bottom: 0.5rem;">1. はじめに</h2>
            <p style="margin-bottom: 2rem;">
              本利用規約（以下「本規約」と言います）は、Blender記事市場（以下「本サービス」と言います）の利用条件を定めるものです。ユーザーの皆さま（以下「ユーザー」と言います）は、本規約に従って本サービスをご利用いただきます。
            </p>

            <h2 style="margin-bottom: 1rem; border-bottom: 2px solid var(--primary-light); padding-bottom: 0.5rem;">2. 著作権と知的財産権</h2>
            <p style="margin-bottom: 1rem;">
              本サービスはBlender Foundationの公式プロジェクトではありません。BlenderはBlender Foundationの登録商標です。
            </p>
            <p style="margin-bottom: 2rem;">
              ユーザーが本サービスに投稿した記事、画像、テキスト等のコンテンツの著作権は、当該ユーザーに帰属します。ただし、ユーザーは本サービスに対して、本サービスの提供・宣伝に必要な範囲で、これらのコンテンツを無償で利用（複製、改変、公衆送信等）する権利を許諾するものとします。
            </p>

            <h2 style="margin-bottom: 1rem; border-bottom: 2px solid var(--primary-light); padding-bottom: 0.5rem;">3. 禁止事項</h2>
            <p style="margin-bottom: 0.5rem;">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul style="margin-bottom: 2rem; margin-left: 2rem;">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
              <li>他のユーザーまたは第三者に不利益、損害、不快感を与える行為</li>
              <li>わいせつ、暴力的なコンテンツの投稿</li>
            </ul>

            <h2 style="margin-bottom: 1rem; border-bottom: 2px solid var(--primary-light); padding-bottom: 0.5rem;">4. コンテンツ의 削除</h2>
            <p style="margin-bottom: 2rem;">
              本サービスの管理者は、ユーザーが投稿したコンテンツが本規約に違反すると判断した場合、またはその他の理由で不適切と判断した場合、ユーザーに事前通知することなく、当該コンテンツを非公開または削除することができるものとします。
            </p>
          </div>
        </div>
      </div>
    </main>
  `;
  Utils.renderContent('app', html);
};
