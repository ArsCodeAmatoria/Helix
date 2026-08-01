"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useFlha } from "@/components/providers/flha-provider";
import { stepLabel } from "@/lib/form-engine";
import { defaultRoleFromWorker } from "@/lib/form-engine";
import {
  getProjectDocuments,
  getProjectEquipment,
  db,
} from "@/lib/db";
import { ProjectModule } from "@/components/modules/project-module";
import { WorkerModule } from "@/components/modules/worker-module";
import { TaskModule } from "@/components/modules/task-module";
import { HazardModule } from "@/components/modules/hazard-module";
import { SiteHazardModule } from "@/components/modules/site-hazard-module";
import { DocumentModule } from "@/components/modules/document-module";
import { EquipmentModule } from "@/components/modules/equipment-module";
import { LadderModule } from "@/components/modules/ladder-module";
import { EnvironmentModule } from "@/components/modules/environment-module";
import { PhotoModule } from "@/components/modules/photo-module";
import { CommentModule } from "@/components/modules/comment-module";
import { SignatureModule } from "@/components/modules/signature-module";
import { PdfPreview } from "@/components/modules/pdf-preview";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function FlhaWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flha = useFlha();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const projectParam = searchParams.get("project");
    if (projectParam && flha.state.projectId !== projectParam) {
      flha.setProject(projectParam);
    }
    if (!flha.state.role) {
      flha.setRole(
        defaultRoleFromWorker(db.worker.roles, db.worker.defaultRole)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleNext = () => {
    const result = flha.next();
    if (!result.ok) {
      setError(result.message ?? "Complete this step");
      return;
    }
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError(null);
    if (flha.state.currentStep === 0) {
      router.push("/");
      return;
    }
    flha.back();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const projectId = flha.state.projectId;
  const documents = projectId ? getProjectDocuments(projectId) : [];
  const equipment = projectId ? getProjectEquipment(projectId) : [];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={handleBack}
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              FLHA · Step {flha.state.currentStep + 1} of {flha.steps.length}
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {stepLabel(flha.currentStepId)}
            </h1>
          </div>
          <ThemeToggle />
        </div>
        <Progress value={flha.progress} className="mt-3 h-2" />
      </header>

      <div className="flex-1 px-4 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={flha.currentStepId}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {flha.currentStepId === "project" && (
              <ProjectModule
                selectedId={flha.state.projectId}
                onSelect={flha.setProject}
              />
            )}
            {flha.currentStepId === "worker" && (
              <WorkerModule
                role={flha.state.role}
                onRoleChange={flha.setRole}
              />
            )}
            {flha.currentStepId === "tasks" && (
              <TaskModule
                selected={flha.state.taskIds}
                onToggle={flha.toggleTask}
              />
            )}
            {flha.currentStepId === "hazards" && (
              <HazardModule
                hazards={flha.resolvedHazards}
                confirmedIds={flha.state.confirmedHazardIds}
                onToggle={flha.toggleHazardConfirm}
                onConfirmAll={flha.confirmAllHazards}
              />
            )}
            {flha.currentStepId === "site-hazards" && (
              <SiteHazardModule
                enabled={flha.state.additionalHazardsEnabled}
                hazards={flha.state.additionalHazards}
                onEnabledChange={flha.setAdditionalHazardsEnabled}
                onAdd={flha.addAdditionalHazard}
                onUpdate={flha.updateAdditionalHazard}
                onRemove={flha.removeAdditionalHazard}
              />
            )}
            {flha.currentStepId === "documents" && (
              <DocumentModule
                documents={documents}
                reviewedIds={flha.state.reviewedDocuments}
                onToggle={flha.toggleDocument}
                onReviewAll={flha.reviewAllDocuments}
              />
            )}
            {flha.currentStepId === "equipment" && (
              <EquipmentModule
                equipment={equipment}
                inspections={flha.state.equipmentInspections}
                onUpdate={flha.updateEquipmentInspection}
              />
            )}
            {flha.currentStepId === "ladder" && (
              <LadderModule
                ladder={flha.state.ladder}
                onToggleType={flha.toggleLadderType}
                onSetField={(field, value) =>
                  flha.setLadderField(field, value)
                }
              />
            )}
            {flha.currentStepId === "environment" && (
              <EnvironmentModule
                selected={flha.state.environment}
                onToggle={flha.toggleEnvironment}
              />
            )}
            {flha.currentStepId === "photos" && (
              <PhotoModule
                photos={flha.state.photos}
                onAdd={flha.addPhoto}
                onRemove={flha.removePhoto}
              />
            )}
            {flha.currentStepId === "comments" && (
              <CommentModule
                value={flha.state.comments}
                onChange={flha.setComments}
              />
            )}
            {flha.currentStepId === "signatures" && (
              <SignatureModule
                signatures={flha.state.signatures}
                onEnsureDefaults={flha.ensureDefaultSigners}
                onAdd={flha.addSigner}
                onUpdate={flha.updateSigner}
                onRemove={flha.removeSigner}
                onLoadTeam={flha.loadTeamSigners}
                onCaptureGps={flha.captureGps}
              />
            )}
            {flha.currentStepId === "preview" && (
              <PdfPreview
                state={flha.state}
                hazards={flha.resolvedHazards}
                onComplete={() => {
                  flha.markComplete();
                  router.push("/forms?submitted=1");
                }}
                onReset={() => {
                  flha.reset();
                  router.push("/");
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {flha.currentStepId !== "preview" && (
        <div className="sticky bottom-20 z-30 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md">
          {error && (
            <p className="mb-2 text-center text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-14 rounded-2xl text-base"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              size="lg"
              className="h-14 rounded-2xl text-base font-semibold"
              onClick={handleNext}
            >
              Continue
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
