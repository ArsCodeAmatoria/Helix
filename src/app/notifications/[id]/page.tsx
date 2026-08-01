import { UpdateDetailScreen } from "@/components/notifications/update-detail-screen";

export default async function UpdateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UpdateDetailScreen id={id} />;
}
