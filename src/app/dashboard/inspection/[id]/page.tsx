import { ActivityDetailScreen } from "@/components/dashboard/activity-detail-screen";

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ActivityDetailScreen kind="inspection" id={id} />;
}
