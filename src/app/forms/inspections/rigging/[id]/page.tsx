import { RiggingLogbookScreen } from "@/components/inspections/rigging-logbook-screen";

export default async function RiggingLogbookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RiggingLogbookScreen gearId={id} />;
}
