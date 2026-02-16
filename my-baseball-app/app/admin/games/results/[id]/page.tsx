import AdminMenu from "@/admin/components/AdminMenu";
import EditGameResultContent from "./components/EditGameResultContent";

export default async function EditGameResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const { year } = await searchParams;

  return (
    <AdminMenu>
      <EditGameResultContent gameId={id} year={year} />
    </AdminMenu>
  );
}
