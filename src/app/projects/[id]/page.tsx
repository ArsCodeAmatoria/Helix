import { ProjectDetailScreen } from "@/components/projects/project-detail-screen";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetailScreen id={id} />;
}
