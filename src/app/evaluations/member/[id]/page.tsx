import { WorkerEvaluationProfileScreen } from "@/components/evaluations/worker-evaluation-profile-screen";

export default async function WorkerEvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkerEvaluationProfileScreen memberId={id} />;
}
