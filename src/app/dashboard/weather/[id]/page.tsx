import { ActivityDetailScreen } from "@/components/dashboard/activity-detail-screen";

export default async function WeatherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ActivityDetailScreen kind="weather" id={id} />;
}
