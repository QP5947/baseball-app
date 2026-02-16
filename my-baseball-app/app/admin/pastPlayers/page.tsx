import AdminLayout from "../components/AdminMenu";
import PastPlayersContent from "./components/PastPlayersContent";

export default function PastPlayersPage() {
  return (
    <AdminLayout>
      <div className="px-4">
        <PastPlayersContent />
      </div>
    </AdminLayout>
  );
}
