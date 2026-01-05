export const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            プライバシーポリシー
          </h1>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                1. 収集する情報
              </h2>
              <p className="text-gray-600">
                当サービスでは、以下の情報を収集します：
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>メールアドレス（アカウント認証・連絡用）</li>
                <li>パスワード（ハッシュ化して保存）</li>
                <li>IPアドレス（セキュリティ・不正アクセス防止）</li>
                <li>操作ログ（サービス改善・セキュリティ監視）</li>
                <li>ブラウザ情報（User Agent）</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                2. 情報の利用目的
              </h2>
              <p className="text-gray-600">
                収集した情報は以下の目的で利用します：
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>ユーザー認証とアカウント管理</li>
                <li>サービスの提供・維持・改善</li>
                <li>セキュリティの確保・不正アクセスの防止</li>
                <li>お問い合わせへの対応</li>
                <li>利用状況の分析</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                3. 情報の保持期間
              </h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>アカウント情報：アカウント削除まで</li>
                <li>操作ログ：90日間（その後自動削除）</li>
                <li>
                  アカウント削除後：30日以内に全データを完全削除
                  （法的要件がある場合を除く）
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                4. ユーザーの権利
              </h2>
              <p className="text-gray-600">ユーザーは以下の権利を有します：</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>
                  <strong>アクセス権：</strong>
                  自分のデータにアクセスし、確認する権利
                </li>
                <li>
                  <strong>訂正権：</strong>
                  不正確なデータを訂正する権利
                </li>
                <li>
                  <strong>削除権（忘れられる権利）：</strong>
                  アカウントと全データの削除を要求する権利
                </li>
                <li>
                  <strong>データポータビリティ権：</strong>
                  自分のデータを機械可読形式でエクスポートする権利
                </li>
              </ul>
              <p className="text-gray-600 mt-2">
                これらの権利は、設定画面から行使できます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                5. 情報の共有
              </h2>
              <p className="text-gray-600">
                当サービスは、以下の場合を除き、ユーザーの個人情報を第三者と共有しません：
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>ユーザーの同意がある場合</li>
                <li>法的要請に応じる必要がある場合</li>
                <li>サービス提供に必要な委託先（データ処理等）</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                6. セキュリティ
              </h2>
              <p className="text-gray-600">
                当サービスは、以下のセキュリティ対策を実施しています：
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>通信の暗号化（HTTPS）</li>
                <li>パスワードのハッシュ化（bcrypt）</li>
                <li>アクセスログの監視</li>
                <li>定期的なセキュリティ更新</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                7. Cookie
              </h2>
              <p className="text-gray-600">
                当サービスでは、認証のためにHttpOnly Cookieを使用しています。
                トラッキング目的のCookieは使用していません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                8. お問い合わせ
              </h2>
              <p className="text-gray-600">
                プライバシーに関するお問い合わせは、以下までご連絡ください：
              </p>
              <p className="text-gray-600">メール: privacy@example.com</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                9. ポリシーの変更
              </h2>
              <p className="text-gray-600">
                本ポリシーは、必要に応じて更新されることがあります。
                重要な変更がある場合は、サービス内で通知します。
              </p>
              <p className="text-gray-500 text-sm mt-4">
                最終更新日: 2026年1月5日
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t">
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              ← ログインページに戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
