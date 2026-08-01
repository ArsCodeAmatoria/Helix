import { ActivityDetailScreen } from "@/components/dashboard/activity-detail-screen";

export default async function DeficiencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ActivityDetailScreen kind="deficiency" id={id} />;
}
