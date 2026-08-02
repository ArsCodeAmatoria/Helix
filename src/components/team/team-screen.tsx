"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  Eraser,
  Search,
  ShieldAlert,
  Users,
  UserCheck,
  UserMinus,
  UsersRound,
} from "lucide-react";
import { useTeam } from "@/components/providers/team-provider";
import {
  isHighlightCert,
  memberHasTaskCert,
  orderedCertsForDisplay,
  shortCertLabel,
  TASK_CERT_FILTERS,
  type TaskCertFilterId,
} from "@/lib/certifications";
import {
  crews,
  getCrewMembers,
  getMemberCrews,
  initials,
  members,
  searchMembers,
} from "@/lib/team";
import type { TeamMember } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Tab = "choose" | "fill" | "sign";
type Scope = "crew" | "directory";

function CertChips({
  member,
  compact,
}: {
  member: TeamMember;
  compact?: boolean;
}) {
  const certs = orderedCertsForDisplay(member.certifications);
  const visible = compact ? certs.slice(0, 4) : certs;
  const extra = compact ? Math.max(0, certs.length - visible.length) : 0;
  const hasFall = memberHasTaskCert(member, "fall");
  const hasSilica = memberHasTaskCert(member, "silica");
  const silicaRelevant = /formwork|concrete|labour|labor|finish|deck|strip/i.test(
    `${member.trade} ${member.role}`
  );
  const missing: string[] = [];
  if (!hasFall) missing.push("Fall Pro");
  if (silicaRelevant && !hasSilica) missing.push("Silica Fit");

  if (certs.length === 0) {
    return (
      <p className="mt-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
        No certifications on file
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {visible.map((cert) => (
          <Badge
            key={cert}
            className={cn(
              "border-0 text-[11px] font-semibold",
              isHighlightCert(cert)
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                : "bg-muted text-muted-foreground"
            )}
          >
            {shortCertLabel(cert)}
          </Badge>
        ))}
        {extra > 0 && (
          <Badge variant="outline" className="text-[11px]">
            +{extra}
          </Badge>
        )}
      </div>
      {missing.length > 0 && (
        <p className="flex flex-wrap items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
          <ShieldAlert className="size-3 shrink-0" />
          Missing: {missing.join(" · ")}
        </p>
      )}
    </div>
  );
}

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
    if (value) {
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
        height={180}
        className="h-28 w-full touch-none rounded-2xl border-2 border-dashed border-border bg-slate-50 dark:bg-slate-100"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
    </div>
  );
}

function MemberRow({
  member,
  selected,
  onToggle,
  trailing,
  showCrews,
  showCerts = true,
}: {
  member: TeamMember;
  selected?: boolean;
  onToggle?: () => void;
  trailing?: React.ReactNode;
  showCrews?: boolean;
  showCerts?: boolean;
}) {
  const memberCrews = showCrews ? getMemberCrews(member.id) : [];

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!onToggle}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-card",
        onToggle && "active:scale-[0.99]"
      )}
    >
      <Avatar className="mt-0.5 size-11">
        <AvatarFallback className="bg-primary/15 font-bold text-primary">
          {initials(member.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{member.name}</p>
        <p className="text-xs text-muted-foreground">
          #{member.employeeNumber} · {member.role}
        </p>
        <p className="text-xs text-muted-foreground">{member.trade}</p>
        {showCrews && (
          <p className="mt-1 text-xs text-muted-foreground">
            {memberCrews.length > 0
              ? memberCrews.map((c) => c.name.replace(/ — .*$/, "")).join(" · ")
              : "Not assigned to a crew"}
          </p>
        )}
        {showCerts && <CertChips member={member} compact />}
      </div>
      {trailing ??
        (selected !== undefined && (
          <span
            className={cn(
              "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border-2",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border"
            )}
          >
            {selected && <Check className="size-5" strokeWidth={3} />}
          </span>
        ))}
    </button>
  );
}

export function TeamScreen() {
  const team = useTeam();
  const [tab, setTab] = useState<Tab>("choose");
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("directory");
  const [certFilter, setCertFilter] = useState<TaskCertFilterId | null>(null);

  const crewMembers = useMemo(
    () => getCrewMembers(team.selectedCrewId),
    [team.selectedCrewId]
  );

  const searchResults = useMemo(() => {
    const base = searchMembers(query, {
      crewId: scope === "crew" ? team.selectedCrewId : undefined,
      directory: scope === "directory",
    });
    if (!certFilter) return base;
    return base.filter((m) => memberHasTaskCert(m, certFilter));
  }, [query, scope, team.selectedCrewId, certFilter]);

  const signProgress =
    team.todaysMembers.length === 0
      ? 0
      : Math.round((team.signedCount / team.todaysMembers.length) * 100);

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "choose", label: "Choose", icon: UsersRound },
    { id: "fill", label: "Fill", icon: UserCheck },
    { id: "sign", label: "Sign", icon: Users },
  ];

  return (
    <div>
      <PageHeader
        title="My Team"
        subtitle={team.selectedCrew?.name ?? "Select a crew"}
      />

      <main className="space-y-5 px-4 py-5">
        <div className="helix-card space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Today&apos;s team
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {team.todaysMembers.length} selected
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Signed
              </p>
              <p className="font-mono text-2xl font-bold tabular-nums text-primary">
                {team.signedCount}/{team.todaysMembers.length || 0}
              </p>
            </div>
          </div>
          <Progress value={signProgress} className="h-2.5" />
          {team.todaysMembers.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
              <span>
                Fall Pro:{" "}
                <span className="font-semibold text-foreground">
                  {
                    team.todaysMembers.filter((m) =>
                      memberHasTaskCert(m, "fall")
                    ).length
                  }
                  /{team.todaysMembers.length}
                </span>
              </span>
              <span>·</span>
              <span>
                Silica Fit:{" "}
                <span className="font-semibold text-foreground">
                  {
                    team.todaysMembers.filter((m) =>
                      memberHasTaskCert(m, "silica")
                    ).length
                  }
                  /{team.todaysMembers.length}
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-card text-muted-foreground ring-1 ring-border"
                )}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "choose" && (
          <section className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pick the crew you&apos;re working with today, then fill the roster.
              Certifications show when you choose members.
            </p>
            {crews.map((crew) => {
              const selected = team.selectedCrewId === crew.id;
              const count = crew.memberIds.length;
              const crewPeople = getCrewMembers(crew.id);
              const fallCount = crewPeople.filter((m) =>
                memberHasTaskCert(m, "fall")
              ).length;
              const silicaCount = crewPeople.filter((m) =>
                memberHasTaskCert(m, "silica")
              ).length;
              return (
                <button
                  key={crew.id}
                  type="button"
                  onClick={() => team.selectCrew(crew.id)}
                  className={cn(
                    "w-full rounded-3xl border p-4 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: crew.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-snug">{crew.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Supervisor: {crew.supervisor}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {count} members · Fall Pro {fallCount}/{count} · Silica{" "}
                        {silicaCount}/{count}
                      </p>
                    </div>
                    {selected && (
                      <Badge className="bg-primary text-primary-foreground">
                        Active
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
            <Button
              size="lg"
              className="h-14 w-full rounded-2xl text-base font-bold"
              onClick={() => {
                team.fillTeam();
                setTab("fill");
              }}
            >
              Use this crew · Fill team
            </Button>
          </section>
        )}

        {tab === "fill" && (
          <section className="space-y-4">
            <div className="flex gap-2">
              <Button
                className="h-12 flex-1 rounded-2xl font-semibold"
                onClick={team.fillTeam}
              >
                <UserCheck className="size-4" />
                Fill team
              </Button>
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-2xl font-semibold"
                onClick={team.clearTeam}
              >
                <UserMinus className="size-4" />
                Clear
              </Button>
            </div>

            <div className="helix-card space-y-3 p-4">
              <p className="text-sm font-semibold">
                Check tickets before assigning — Fall Pro, Silica Fit Test, and
                other certs show on each worker.
              </p>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => {
                    const next = e.target.value;
                    setQuery(next);
                    if (next.trim()) setScope("directory");
                  }}
                  onFocus={() => {
                    if (query.trim()) setScope("directory");
                  }}
                  placeholder="Search name, #, role, or cert…"
                  className="h-14 rounded-2xl pl-11 text-base"
                  autoComplete="off"
                  inputMode="search"
                />
              </div>

              <div className="flex gap-2">
                {(
                  [
                    ["directory", `Directory (${members.length})`],
                    ["crew", `This crew (${crewMembers.length})`],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setScope(id)}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-semibold",
                      scope === id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Filter by task ticket
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setCertFilter(null)}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold",
                      certFilter === null
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    All
                  </button>
                  {TASK_CERT_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        setCertFilter((prev) => (prev === f.id ? null : f.id))
                      }
                      className={cn(
                        "shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold",
                        certFilter === f.id
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {team.todaysMembers.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-bold">
                  Selected ({team.todaysMembers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {team.todaysMembers.map((m) => {
                    const missingFall = !memberHasTaskCert(m, "fall");
                    const missingSilica = !memberHasTaskCert(m, "silica");
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => team.removeMember(m.id)}
                        className={cn(
                          "inline-flex flex-col items-start gap-0.5 rounded-2xl px-3 py-2 text-left",
                          missingFall || missingSilica
                            ? "bg-amber-500/15 text-amber-900 dark:text-amber-200"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        <span className="text-sm font-semibold">
                          {m.name.split(" ")[0]}{" "}
                          <span className="opacity-60">×</span>
                        </span>
                        <span className="text-[10px] font-medium opacity-80">
                          {[
                            memberHasTaskCert(m, "fall") ? "Fall Pro" : null,
                            memberHasTaskCert(m, "silica") ? "Silica" : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Check tickets"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-bold">
                {query || certFilter
                  ? `Results (${searchResults.length})`
                  : scope === "crew"
                    ? "Crew roster"
                    : "Company directory"}
                {certFilter
                  ? ` · has ${TASK_CERT_FILTERS.find((f) => f.id === certFilter)?.label}`
                  : ""}
              </p>
              {searchResults.length === 0 && (
                <div className="helix-card space-y-3 p-6 text-center text-sm text-muted-foreground">
                  <p>
                    {certFilter
                      ? `No workers with that ticket match${query ? ` “${query}”` : ""}.`
                      : `No workers match “${query}”.`}
                  </p>
                  {scope === "crew" && (
                    <Button
                      variant="outline"
                      className="h-11 rounded-xl font-semibold"
                      onClick={() => setScope("directory")}
                    >
                      Search full directory
                    </Button>
                  )}
                </div>
              )}
              {searchResults.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  selected={team.todaysMemberIds.includes(member.id)}
                  onToggle={() => team.toggleMember(member.id)}
                  showCrews={scope === "directory"}
                />
              ))}
            </div>

            <Button
              size="lg"
              className="h-14 w-full rounded-2xl text-base font-bold"
              disabled={team.todaysMembers.length === 0}
              onClick={() => setTab("sign")}
            >
              Continue to signatures ({team.todaysMembers.length})
            </Button>
            {team.todaysMembers.length > 0 && (
              <Button
                asChild
                variant="outline"
                className="h-12 w-full rounded-2xl font-semibold"
              >
                <Link href="/evaluations">
                  Competency evaluations for crew
                </Link>
              </Button>
            )}
          </section>
        )}

        {tab === "sign" && (
          <section className="space-y-4">
            <div className="helix-card space-y-2 p-4">
              <p className="font-bold">Team acknowledgements</p>
              <p className="text-sm text-muted-foreground">
                Each selected worker signs below. Review tickets before they
                sign onto today&apos;s FLHA.
              </p>
              <Progress value={signProgress} className="h-2.5" />
              <p className="text-xs font-semibold text-muted-foreground">
                {team.signedCount} of {team.todaysMembers.length} signed ·{" "}
                {signProgress}%
              </p>
            </div>

            {team.todaysMembers.length === 0 && (
              <div className="helix-card p-6 text-center text-sm text-muted-foreground">
                No team selected yet. Fill your crew first.
                <Button
                  className="mt-4 h-12 w-full rounded-2xl"
                  onClick={() => setTab("fill")}
                >
                  Fill team
                </Button>
              </div>
            )}

            {team.todaysMembers.map((member, index) => {
              const sig = team.signatures.find((s) => s.memberId === member.id);
              const done = Boolean(sig?.signature);
              return (
                <div
                  key={member.id}
                  className={cn(
                    "helix-card space-y-3 p-4",
                    done && "ring-2 ring-emerald-500/25"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="size-11">
                      <AvatarFallback className="bg-primary/15 font-bold text-primary">
                        {initials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-muted-foreground">
                        Signer {index + 1}
                        {done ? " · Signed" : ""}
                      </p>
                      <p className="font-bold leading-snug">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        #{member.employeeNumber} · {member.role}
                      </p>
                      <CertChips member={member} />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-10 text-muted-foreground"
                      onClick={() => team.removeMember(member.id)}
                      aria-label="Remove from team"
                    >
                      <UserMinus className="size-4" />
                    </Button>
                  </div>
                  <MiniPad
                    value={sig?.signature ?? null}
                    onChange={(dataUrl) =>
                      team.setMemberSignature(member.id, dataUrl)
                    }
                  />
                  {sig?.signedAt && (
                    <p className="text-xs text-muted-foreground">
                      Signed {new Date(sig.signedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}

            {team.todaysMembers.length > 0 && (
              <Button
                variant="outline"
                className="h-12 w-full rounded-2xl"
                onClick={team.clearAllSignatures}
              >
                Clear all signatures
              </Button>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
