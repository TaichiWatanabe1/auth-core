import { Layout } from "../components/layout/Layout";
import { CrudPanel } from "../components/top/CrudPanel";

export const TopPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600 mt-1">Auth & Audit Platform へようこそ</p>
        </div>

        <CrudPanel />
      </div>
    </Layout>
  );
};
