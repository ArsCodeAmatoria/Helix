import { ActivityDetailScreen } from "@/components/dashboard/activity-detail-screen";

export default async function ActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ActivityDetailScreen kind="action" id={id} />;
}
