"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eraser, Minus, X } from "lucide-react";
import { useEvaluations } from "@/components/providers/evaluation-provider";
import {
  blankEvaluationItems,
  evaluationChecklists,
  getEvaluationChecklist,
  tracksForMember,
} from "@/lib/evaluations";
import { db } from "@/lib/db";
import { getMember, members } from "@/lib/team";
import type {
  EvaluationCheckItem,
  EvaluationItemResult,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function MiniPad({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (value && value.startsWith("data:image")) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          <Eraser className="size-4" />
          Clear
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={160}
        className="h-28 w-full touch-none rounded-2xl border-2 border-dashed border-border bg-slate-50"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
    </div>
  );
}

export function EvaluationRunScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const evals = useEvaluations();

  const initialMember = params.get("member") ?? "";
  const initialChecklist = params.get("checklist") ?? "";

  const [memberId, setMemberId] = useState(initialMember);
  const [checklistId, setChecklistId] = useState(initialChecklist);
  const [evaluatorName, setEvaluatorName] = useState("Dave Okonkwo");
  const [evaluatorRole, setEvaluatorRole] = useState("Supervisor");
  const [projectId, setProjectId] = useState(
    db.projects.find((p) => p.assignedToday)?.id ?? ""
  );
  const [notes, setNotes] = useState("");
  const [supervisorName, setSupervisorName] = useState("Dave Okonkwo");
  const [signature, setSignature] = useState<string | null>(null);
  const [items, setItems] = useState<EvaluationCheckItem[]>([]);

  const member = memberId ? getMember(memberId) : undefined;
  const checklist = checklistId
    ? getEvaluationChecklist(checklistId)
    : undefined;

  const suggestedChecklists = useMemo(() => {
    if (!member) return evaluationChecklists;
    const trackIds = new Set(tracksForMember(member).map((t) => t.id));
    return evaluationChecklists.filter((c) => trackIds.has(c.trackId));
  }, [member]);

  useEffect(() => {
    if (!checklist) {
      setItems([]);
      return;
    }
    setItems(blankEvaluationItems(checklist));
  }, [checklist]);

  const incomplete = items.some((i) => i.result === null);
  const hasFail = items.some((i) => i.result === "fail");
  const canSave =
    Boolean(member && checklist) &&
    !incomplete &&
    Boolean(signature) &&
    supervisorName.trim().length > 0;

  const setResult = (id: string, result: EvaluationItemResult) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, result: i.result === result ? null : result } : i
      )
    );
  };

  const markAllPass = () => {
    setItems((prev) => prev.map((i) => ({ ...i, result: "pass" })));
  };

  const submit = () => {
    if (!member || !checklist || !canSave) return;
    evals.addRecord({
      memberId: member.id,
      checklistId: checklist.id,
      trackId: checklist.trackId,
      stageId: checklist.stageId,
      evaluatorName: evaluatorName.trim(),
      evaluatorRole,
      projectId: projectId || null,
      items,
      notes: notes.trim(),
      supervisorName: supervisorName.trim(),
      supervisorSignature: signature,
      supervisorSignedAt: new Date().toISOString(),
    });
    router.push(`/evaluations/member/${member.id}`);
  };

  return (
    <div>
      <PageHeader
        title="Run evaluation"
        subtitle="Checklist + supervisor sign-off"
        backHref={
          memberId ? `/evaluations/member/${memberId}` : "/evaluations"
        }
      />

      <main className="space-y-4 px-4 py-5 pb-8">
        <div className="helix-card space-y-3 p-4">
          <div className="space-y-1.5">
            <Label>Worker</Label>
            <select
              className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            >
              <option value="">Select worker</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.role}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Evaluation checklist</Label>
            <select
              className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
              value={checklistId}
              onChange={(e) => setChecklistId(e.target.value)}
            >
              <option value="">Select checklist</option>
              {suggestedChecklists.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          {checklist && (
            <p className="text-xs text-muted-foreground">
              {checklist.audience} · {checklist.category} · ~
              {checklist.estimatedMinutes} min · {checklist.items.length} items
            </p>
          )}
        </div>

        {checklist && (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold">Checklist</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-xl"
                onClick={markAllPass}
              >
                Mark all pass
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-3.5"
                >
                  <p className="text-sm font-semibold leading-snug">
                    {item.label}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(
                      [
                        ["pass", "Pass", Check, "bg-emerald-600 text-white"],
                        ["fail", "Fail", X, "bg-rose-600 text-white"],
                        ["na", "N/A", Minus, "bg-slate-500 text-white"],
                      ] as const
                    ).map(([value, label, Icon, active]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setResult(item.id, value)}
                        className={cn(
                          "flex h-11 items-center justify-center gap-1 rounded-xl text-sm font-semibold ring-1 ring-border",
                          item.result === value
                            ? active
                            : "bg-muted/50 text-muted-foreground"
                        )}
                      >
                        <Icon className="size-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {hasFail && (
              <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-800 dark:text-rose-200">
                Fail on any item records as overall fail — coach and re-evaluate
                before counting toward pathway progress.
              </p>
            )}

            <div className="helix-card space-y-3 p-4">
              <p className="font-bold">Evaluator</p>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  className="h-12 rounded-xl"
                  value={evaluatorName}
                  onChange={(e) => setEvaluatorName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <select
                  className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  value={evaluatorRole}
                  onChange={(e) => setEvaluatorRole(e.target.value)}
                >
                  <option>Supervisor</option>
                  <option>Foreman</option>
                  <option>Safety Coordinator</option>
                  <option>Lead Hand</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Project</Label>
                <select
                  className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">Optional</option>
                  {db.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  className="min-h-20 rounded-xl"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Coaching notes, conditions, next steps…"
                />
              </div>
            </div>

            <div className="helix-card space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold">Supervisor / foreman sign-off</p>
                  <p className="text-xs text-muted-foreground">
                    Required for this evaluation to count on the worker&apos;s
                    pathway.
                  </p>
                </div>
                <Badge variant="secondary">Required</Badge>
              </div>
              <div className="space-y-1.5">
                <Label>Printed name</Label>
                <Input
                  className="h-12 rounded-xl"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                />
              </div>
              <MiniPad value={signature} onChange={setSignature} />
            </div>

            <Button
              size="lg"
              className="h-14 w-full rounded-2xl text-base font-bold"
              disabled={!canSave}
              onClick={submit}
            >
              Save signed evaluation
            </Button>
            {!canSave && (
              <p className="text-center text-sm text-muted-foreground">
                Complete every item and capture a supervisor signature to save.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
