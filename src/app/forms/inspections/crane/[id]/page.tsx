import { CraneLogbookScreen } from "@/components/inspections/crane-logbook-screen";

export default async function CraneLogbookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CraneLogbookScreen equipmentId={id} />;
}
