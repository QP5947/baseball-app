import AdminMenu from "../components/AdminMenu";
import TeamSettingsForm from "./components/TeamSettingsForm";

export default function SettingsPage() {
  return (
    <AdminMenu>
      <div className="max-w-2xl items-center mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">システム設定</h1>
          <p className="text-gray-600">
            チーム情報とシステム設定を管理します
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            チーム設定
          </h2>
          <TeamSettingsForm />
        </div>
      </div>
    </AdminMenu>
  );
}
