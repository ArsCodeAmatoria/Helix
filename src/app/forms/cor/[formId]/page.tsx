import { DigitalFormDeepLink } from "@/components/digital-forms/digital-forms-hub-screen";

export default async function CorDigitalFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  return <DigitalFormDeepLink formId={formId} />;
}
