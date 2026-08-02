"use client";

import { db, getProject, getTask } from "@/lib/db";
import type { FlhaFormState, Hazard } from "@/lib/types";
import { HelixLogo } from "@/components/brand/helix-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PdfPreviewProps {
  state: FlhaFormState;
  hazards: Hazard[];
  onComplete: () => void;
  onReset: () => void;
}

export function PdfPreview({
  state,
  hazards,
  onComplete,
  onReset,
}: PdfPreviewProps) {
  const project = state.projectId ? getProject(state.projectId) : null;
  const worker = db.worker;
  const company = db.company;
  const tasks = state.taskIds.map((id) => getTask(id)?.label).filter(Boolean);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Professional FLHA preview — ready to submit or print.
      </p>

      <Card className="overflow-hidden border-2 shadow-lg print:border-0 print:shadow-none">
        <CardHeader className="bg-slate-900 text-white dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <HelixLogo iconClassName="size-12 rounded-xl bg-sky-500" />
            <div>
              <CardTitle className="text-lg text-white">{company.name}</CardTitle>
              <p className="text-sm text-slate-300">
                Field Level Hazard Assessment
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5 text-sm">
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Project
            </h3>
            {project ? (
              <dl className="space-y-1">
                <p className="text-base font-semibold">{project.name}</p>
                <p>
                  {project.projectNumber} · {project.client}
                </p>
                <p className="text-muted-foreground">
                  {project.address}, {project.city}, {project.province}
                </p>
                <p className="text-muted-foreground">
                  Muster: {project.musterPoint} · Radio: {project.radioChannel}
                </p>
              </dl>
            ) : (
              <p>—</p>
            )}
          </section>

          <Separator />

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Worker
            </h3>
            <p className="font-semibold">
              {worker.name} · #{worker.employeeNumber}
            </p>
            <p className="text-muted-foreground">
              Role: {state.role} · Crew: {worker.crew}
            </p>
            <p className="text-muted-foreground">
              Supervisor: {worker.supervisor}
            </p>
          </section>

          <Separator />

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Today&apos;s tasks
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {tasks.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-800 dark:text-sky-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Hazards & controls
            </h3>
            <div className="space-y-3">
              {hazards.map((h) => (
                <div key={h.id} className="rounded-xl border p-3">
                  <p className="font-semibold">
                    {h.title}{" "}
                    <span className="text-xs font-normal capitalize text-muted-foreground">
                      ({h.severity}) · Reviewed
                    </span>
                  </p>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {h.controls.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {state.additionalHazards.map((h) => (
                <div key={h.id} className="rounded-xl border border-amber-500/30 p-3">
                  <p className="font-semibold">{h.hazard}</p>
                  <p className="text-muted-foreground">{h.control}</p>
                  {h.responsiblePerson && (
                    <p className="text-xs text-muted-foreground">
                      Responsible: {h.responsiblePerson}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {state.environment.length > 0 && (
            <>
              <Separator />
              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Environment
                </h3>
                <p>{state.environment.join(", ")}</p>
              </section>
            </>
          )}

          {state.comments && (
            <>
              <Separator />
              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Comments
                </h3>
                <p className="whitespace-pre-wrap">{state.comments}</p>
              </section>
            </>
          )}

          {state.photos.length > 0 && (
            <>
              <Separator />
              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Photos
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {state.photos.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={p.id}
                      src={p.dataUrl}
                      alt={p.caption}
                      className="aspect-square rounded-lg object-cover"
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          <Separator />

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Signatures ({state.signatures.signers.length})
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {state.signatures.signers.map((signer) => (
                <div key={signer.id} className="rounded-xl border p-3">
                  <p className="font-semibold">{signer.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{signer.role}</p>
                  {signer.signature ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={signer.signature}
                      alt={`${signer.name} signature`}
                      className="mt-2 h-14 w-full rounded-lg border bg-white object-contain"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Not signed
                    </p>
                  )}
                  {signer.signedAt && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(signer.signedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            {state.signatures.timestamp && (
              <p>Timestamp: {new Date(state.signatures.timestamp).toLocaleString()}</p>
            )}
            {state.signatures.gps && (
              <p>
                GPS: {state.signatures.gps.lat.toFixed(5)},{" "}
                {state.signatures.gps.lng.toFixed(5)}
              </p>
            )}
            <p className="mt-1">Generated by Helix · Offline-capable prototype</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        <Button
          size="lg"
          className="h-14 rounded-2xl text-base font-semibold"
          onClick={() => {
            onComplete();
            window.print();
          }}
        >
          Submit & print PDF
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-12 rounded-2xl"
          onClick={onReset}
        >
          Start new FLHA
        </Button>
      </div>
    </div>
  );
}
