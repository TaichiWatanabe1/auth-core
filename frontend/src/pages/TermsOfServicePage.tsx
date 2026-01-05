export const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                第1条（適用）
              </h2>
              <p className="text-gray-600">
                本規約は、当サービス（以下「本サービス」）の利用に関する条件を定めるものです。
                ユーザーは、本規約に同意した上で本サービスを利用するものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                第2条（アカウント）
              </h2>
              <ol className="list-decimal pl-6 text-gray-600 space-y-2">
                <li>
                  ユーザーは、正確な情報を提供してアカウントを登録するものとします。
                </li>
                <li>
                  ユーザーは、自己のアカウント情報を適切に管理し、
                  第三者に利用させてはなりません。
                </li>
                <li>
                  アカウント情報の管理不十分による損害について、
                  当サービスは責任を負いません。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                第3条（禁止事項）
              </h2>
              <p className="text-gray-600">
                ユーザーは、以下の行為を行ってはなりません：
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>
                  当サービスのサーバーやネットワークに過度な負荷をかける行為
                </li>
                <li>当サービスの運営を妨害する行為</li>
                <li>他のユーザーの情報を不正に収集する行為</li>
                <li>他のユーザーになりすます行為</li>
                <li>当サービスに関連して反社会的勢力に利益を供与する行為</li>
                <li>その他、当サービスが不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                第4条（サービスの変更・停止）
              </h2>
              <p className="text-gray-600">
                当サービスは、以下の場合にサービスの全部または一部を変更・停止できるものとします：
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>システムの保守・点検を行う場合</li>
                <li>天災、事故等の不可抗力による場合</li>
                <li>その他、運営上必要と判断した場合</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                第5条（知的財産権）
              </h2>
              <p className="text-gray-600">
                本サービスに関する知的財産権は、当サービスまたは正当な権利者に帰属します。
                ユーザーが本サービスに投稿したコンテンツの知的財産権は、
                ユーザーに帰属します。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                第6条（免責事項）
              </h2>
              <ol className="list-decimal pl-6 text-gray-600 space-y-2">
                <li>
                  当サービスは、本サービスに事実上または法律上の瑕疵がないことを
                  保証するものではありません。
                </li>
                <li>
                  当サービスは、本サービスに起因してユーザーに生じた損害について、
                  故意または重過失がある場合を除き、責任を負いません。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                第7条（アカウントの削除）
              </h2>
              <ol className="list-decimal pl-6 text-gray-600 space-y-2">
                <li>
                  ユーザーは、設定画面からいつでもアカウントを削除できます。
                </li>
                <li>
                  アカウント削除後、ユーザーのデータは30日以内に完全に削除されます
                  （法的要件がある場合を除く）。
                </li>
                <li>
                  当サービスは、ユーザーが本規約に違反した場合、
                  事前の通知なくアカウントを停止または削除できるものとします。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                第8条（個人情報）
              </h2>
              <p className="text-gray-600">
                当サービスは、ユーザーの個人情報を「プライバシーポリシー」に
                従って適切に取り扱います。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                第9条（規約の変更）
              </h2>
              <p className="text-gray-600">
                当サービスは、必要に応じて本規約を変更できるものとします。
                重要な変更がある場合は、サービス内で通知します。
                変更後に本サービスを利用した場合、変更後の規約に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                第10条（準拠法・管轄）
              </h2>
              <p className="text-gray-600">
                本規約の解釈は日本法に準拠し、本サービスに関する紛争については、
                東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </section>

            <p className="text-gray-500 text-sm mt-8">
              最終更新日: 2026年1月5日
            </p>
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
