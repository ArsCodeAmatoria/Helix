import { DocumentDetailScreen } from "@/components/forms/document-detail-screen";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentDetailScreen id={id} />;
}
