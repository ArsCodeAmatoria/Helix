"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  ExternalLink,
  FileText,
  Minus,
  RotateCcw,
  TowerControl,
  X,
} from "lucide-react";
import { useBcCraneBinder } from "@/components/providers/bc-crane-binder-provider";
import {
  bcCraneBinder,
  cycleItemStatus,
} from "@/lib/bc-crane-binder";
import type { BcCraneBinderItemStatus, BcCraneBinderPartyId } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Tab = "header" | "docs" | "signoffs";

function statusStyle(status: BcCraneBinderItemStatus) {
  if (status === "present") {
    return "bg-emerald-600 text-white";
  }
  if (status === "missing") {
    return "bg-rose-600 text-white";
  }
  if (status === "na") {
    return "bg-slate-500 text-white";
  }
  return "bg-muted text-muted-foreground ring-1 ring-border";
}

function StatusButton({
  status,
  onCycle,
}: {
  status: BcCraneBinderItemStatus;
  onCycle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCycle}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl",
        statusStyle(status)
      )}
      aria-label={
        status === "present"
          ? "Present — tap for missing"
          : status === "missing"
            ? "Missing — tap for N/A"
            : status === "na"
              ? "N/A — tap to clear"
              : "Not checked — tap for present"
      }
    >
      {status === "present" ? (
        <Check className="size-5" strokeWidth={3} />
      ) : status === "missing" ? (
        <X className="size-5" strokeWidth={3} />
      ) : status === "na" ? (
        <Minus className="size-5" />
      ) : (
        <FileText className="size-5" />
      )}
    </button>
  );
}

export function BcCraneBinderScreen() {
  const binder = useBcCraneBinder();
  const { state, progress } = binder;
  const [tab, setTab] = useState<Tab>("docs");
  const [openSection, setOpenSection] = useState<string>(
    bcCraneBinder.sections[0]?.id ?? ""
  );

  const missingItems = useMemo(() => {
    const list: { id: string; label: string; section: string }[] = [];
    for (const section of bcCraneBinder.sections) {
      for (const item of section.items) {
        if (state.items[item.id]?.status === "missing") {
          list.push({
            id: item.id,
            label: item.label,
            section: section.title,
          });
        }
      }
    }
    return list;
  }, [state.items]);

  return (
    <div>
      <PageHeader
        title="BC Crane erection binder"
        subtitle={`${bcCraneBinder.docNumber} · Site binder checklist`}
        backHref="/forms"
      />

      <main className="space-y-4 px-4 py-5">
        <div className="helix-card space-y-3 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-700 dark:text-orange-400">
              <TowerControl className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <Badge className="mb-2 border-0 bg-orange-500/15 text-orange-800 dark:text-orange-300">
                {bcCraneBinder.docNumber} · {bcCraneBinder.docDate}
              </Badge>
              <p className="font-bold leading-snug">{bcCraneBinder.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {bcCraneBinder.subtitle}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {bcCraneBinder.copyright}. Interactive checklist for Helix sites —
            keep the signed paper / PDF binder as the official record.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <a
                href={bcCraneBinder.pdf}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" />
                Open PDF
              </a>
            </Button>
            <Button
              variant="secondary"
              className="h-11 rounded-xl"
              onClick={binder.loadSeed}
            >
              <RotateCcw className="size-4" />
              Load demo
            </Button>
          </div>
        </div>

        <div className="helix-card space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Binder progress
              </p>
              <p className="font-mono text-2xl font-bold tabular-nums">
                {progress.answered}/{progress.total}
              </p>
            </div>
            <Badge
              className={cn(
                "border-0",
                progress.complete
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : progress.missing > 0
                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              )}
            >
              {progress.complete
                ? "Complete"
                : progress.missing > 0
                  ? `${progress.missing} missing`
                  : `${progress.percent}% checked`}
            </Badge>
          </div>
          <Progress value={progress.percent} className="h-2.5" />
          <p className="text-xs text-muted-foreground">
            {progress.present} on file · {progress.na} N/A · {progress.missing}{" "}
            gaps
            {state.updatedAt
              ? ` · Updated ${new Date(state.updatedAt).toLocaleString()}`
              : ""}
          </p>
        </div>

        {missingItems.length > 0 && (
          <div className="helix-card flex gap-3 border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-600" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-rose-900 dark:text-rose-200">
                Open documentation gaps
              </p>
              <ul className="mt-1 space-y-1 text-rose-800/90 dark:text-rose-200/80">
                {missingItems.slice(0, 4).map((m) => (
                  <li key={m.id}>
                    #{m.id} {m.label}
                  </li>
                ))}
                {missingItems.length > 4 && (
                  <li>+{missingItems.length - 4} more</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["header", "Site"],
              ["docs", "Docs"],
              ["signoffs", "Sign-off"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "min-h-12 rounded-2xl text-sm font-semibold",
                tab === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-border"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "header" && (
          <section className="space-y-3 pb-4">
            <div className="helix-card space-y-3 p-4">
              <p className="text-sm font-bold">Meeting / crane header</p>
              {(
                [
                  ["siteAddress", "Site address", "text"],
                  ["meetingDate", "Meeting date", "date"],
                  ["activitySupervisor", "Activity supervisor", "text"],
                  ["contractor", "Contractor", "text"],
                  ["craneMake", "Crane make", "text"],
                  ["craneModel", "Crane model", "text"],
                  ["craneSerial", "Crane serial #", "text"],
                ] as const
              ).map(([key, label, type]) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input
                    type={type}
                    className="h-12 rounded-xl"
                    value={String(state[key] ?? "")}
                    onChange={(e) =>
                      binder.updateHeader({ [key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="h-12 w-full rounded-2xl"
              onClick={binder.reset}
            >
              Clear binder
            </Button>
          </section>
        )}

        {tab === "docs" && (
          <section className="space-y-3 pb-4">
            <p className="text-sm text-muted-foreground">
              Tap status: Present → Missing → N/A. Assign who holds the document
              when it applies.
            </p>

            {bcCraneBinder.sections.map((section) => {
              const open = openSection === section.id;
              const sectionItems = section.items.map(
                (item) => state.items[item.id]
              );
              const sectionMissing = sectionItems.filter(
                (i) => i?.status === "missing"
              ).length;
              const sectionDone = sectionItems.filter(
                (i) => i?.status === "present" || i?.status === "na"
              ).length;

              return (
                <div key={section.id} className="helix-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSection(open ? "" : section.id)
                    }
                    className="flex w-full items-start gap-3 p-4 text-left"
                  >
                    <ClipboardList className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-snug">{section.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sectionDone}/{section.items.length} checked
                        {sectionMissing > 0
                          ? ` · ${sectionMissing} missing`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {open ? "Hide" : "Open"}
                    </Badge>
                  </button>

                  {open && (
                    <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
                      {section.items.map((item) => {
                        const row = state.items[item.id] ?? {
                          status: null,
                          partyId: null,
                          notes: "",
                        };
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "rounded-2xl border p-3.5",
                              row.status === "missing"
                                ? "border-rose-500/30 bg-rose-500/5"
                                : row.status === "present"
                                  ? "border-emerald-500/30 bg-emerald-500/5"
                                  : "border-border bg-card"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <StatusButton
                                status={row.status}
                                onCycle={() =>
                                  binder.setItemStatus(
                                    item.id,
                                    cycleItemStatus(row.status)
                                  )
                                }
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-muted-foreground">
                                  #{item.id}
                                </p>
                                <p className="text-sm font-semibold leading-snug">
                                  {item.label}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {bcCraneBinder.parties
                                    .filter((p) => p.id !== "na")
                                    .map((party) => (
                                      <button
                                        key={party.id}
                                        type="button"
                                        onClick={() =>
                                          binder.setItemParty(
                                            item.id,
                                            row.partyId === party.id
                                              ? null
                                              : (party.id as BcCraneBinderPartyId)
                                          )
                                        }
                                        className={cn(
                                          "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                          row.partyId === party.id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                        )}
                                      >
                                        {party.label.split(" ")[0]}
                                      </button>
                                    ))}
                                </div>
                                {(row.status === "missing" ||
                                  row.notes) && (
                                  <Input
                                    className="mt-2 h-10 rounded-xl text-sm"
                                    placeholder="Gap notes…"
                                    value={row.notes}
                                    onChange={(e) =>
                                      binder.setItemNotes(
                                        item.id,
                                        e.target.value
                                      )
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="space-y-1.5">
                        <Label>Section notes</Label>
                        <Textarea
                          className="min-h-20 rounded-xl"
                          value={state.sectionNotes[section.id] ?? ""}
                          onChange={(e) =>
                            binder.setSectionNotes(section.id, e.target.value)
                          }
                          placeholder="Notes for this section…"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="helix-card space-y-3 p-4">
              <p className="font-bold">Other site-specific documents</p>
              <p className="text-sm text-muted-foreground">
                Extra tower crane ops docs required for this site (FM-TC-01 p.5).
              </p>
              {state.otherDocs.map((doc, i) => (
                <Input
                  key={i}
                  className="h-12 rounded-xl"
                  placeholder={`Additional document ${i + 1}`}
                  value={doc}
                  onChange={(e) => binder.setOtherDoc(i, e.target.value)}
                />
              ))}
            </div>
          </section>
        )}

        {tab === "signoffs" && (
          <section className="space-y-3 pb-4">
            <p className="text-sm text-muted-foreground">
              Role confirmations from FM-TC-01 sign-off page. Capture company,
              contact, and printed name.
            </p>
            {bcCraneBinder.signOffRoles.map((role) => {
              const row = state.signOffs[role.id] ?? {
                company: "",
                phone: "",
                printName: "",
                confirmed: false,
              };
              return (
                <div
                  key={role.id}
                  className={cn(
                    "helix-card space-y-3 p-4",
                    row.confirmed && "ring-2 ring-emerald-500/25"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{role.role}</p>
                      <p className="text-xs text-muted-foreground">
                        {role.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        binder.setSignOff(role.id, {
                          confirmed: !row.confirmed,
                        })
                      }
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-xl",
                        row.confirmed
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Check className="size-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      className="h-11 rounded-xl"
                      placeholder="Company"
                      value={row.company}
                      onChange={(e) =>
                        binder.setSignOff(role.id, {
                          company: e.target.value,
                        })
                      }
                    />
                    <Input
                      className="h-11 rounded-xl"
                      placeholder="Phone #"
                      value={row.phone}
                      onChange={(e) =>
                        binder.setSignOff(role.id, { phone: e.target.value })
                      }
                    />
                    <Input
                      className="h-11 rounded-xl"
                      placeholder="Print name"
                      value={row.printName}
                      onChange={(e) =>
                        binder.setSignOff(role.id, {
                          printName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
