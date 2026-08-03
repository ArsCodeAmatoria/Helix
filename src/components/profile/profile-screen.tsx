"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Bell,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  HardHat,
  MapPinned,
  Megaphone,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  getCurrentMember,
  getMemberCrews,
  initials,
  mergedCertifications,
} from "@/lib/team";
import { shortCertLabel } from "@/lib/certifications";
import { scoreWorkerCompliance } from "@/lib/cor-worker";
import {
  passedChecklistIds,
  trackProgress,
  tracksForMember,
} from "@/lib/evaluations";
import { getMemberActivity } from "@/lib/worker-activity";
import { useEvaluations } from "@/components/providers/evaluation-provider";
import { useTimeClock } from "@/components/providers/timeclock-provider";
import { useToolbox } from "@/components/providers/toolbox-provider";
import { useDocumentReview } from "@/components/providers/document-review-provider";
import { useSiteInspections } from "@/components/providers/site-inspection-provider";
import { useTeamOptional } from "@/components/providers/team-provider";
import { useNotificationsOptional } from "@/components/providers/notifications-provider";
import { UnreadCountBadge } from "@/components/notifications/unread-count-badge";
import { PageHeader } from "@/components/layout/page-header";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/lib/types";

function LinkRow({
  href,
  icon: Icon,
  title,
  subtitle,
  value,
  tone,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  value?: string;
  tone?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl bg-muted/50 px-3 py-3 active:scale-[0.99]"
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          tone ?? "bg-primary/15 text-primary"
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-snug">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {value && (
        <span className="shrink-0 font-mono text-sm font-bold tabular-nums">
          {value}
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function CertGrid({ certs }: { certs: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {certs.map((cert) => (
        <Badge
          key={cert}
          className="border-0 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300"
          title={cert}
        >
          {shortCertLabel(cert)}
        </Badge>
      ))}
    </div>
  );
}

export function ProfileScreen() {
  const worker = db.worker;
  const company = db.company;
  const member = getCurrentMember(worker);
  const memberId = member?.id ?? worker.memberId ?? "m-chen";
  const team = useTeamOptional();
  const evals = useEvaluations();
  const clock = useTimeClock();
  const toolbox = useToolbox();
  const reviews = useDocumentReview();
  const siteInspections = useSiteInspections();
  const notifications = useNotificationsOptional();

  const unread =
    notifications?.unreadCount ??
    db.notifications.filter((n) => !n.read).length;
  const crews = member ? getMemberCrews(member.id) : [];
  const certs = mergedCertifications(worker.certifications, member);

  const compliance = useMemo(() => {
    if (!member) return null;
    const synthetic: TeamMember = {
      ...member,
      certifications: certs,
    };
    return scoreWorkerCompliance(synthetic);
  }, [member, certs]);

  const tracks = useMemo(
    () => (member ? tracksForMember(member) : []),
    [member]
  );
  const passed = useMemo(
    () => passedChecklistIds(evals.records, memberId),
    [evals.records, memberId]
  );
  const primaryTrack = tracks[0];
  const trackPct = primaryTrack
    ? trackProgress(primaryTrack, passed).percent
    : 0;

  const activity = getMemberActivity(memberId);
  const myTalks = toolbox.talks.filter(
    (t) =>
      t.facilitatorName === worker.name ||
      t.attendeeMemberIds.includes(memberId)
  );
  const talksFacilitated = toolbox.talks.filter(
    (t) => t.facilitatorName === worker.name
  ).length;
  const talksAttended = toolbox.talks.filter((t) =>
    t.attendeeMemberIds.includes(memberId)
  ).length;

  const inspectionsLed = siteInspections.inspections.filter(
    (i) => i.inspector === worker.name || i.inspector.includes(worker.name.split(" ")[0])
  ).length;

  const todayCrew = team?.todaysMembers.length ?? 0;
  const activeVisit = clock.activeVisit;
  const visitsToday = clock.visits.filter((v) => {
    const d = new Date(v.clockIn);
    return d.toDateString() === new Date().toDateString();
  }).length;

  const hireLabel = worker.hireDate
    ? new Date(worker.hireDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div>
      <PageHeader title="My profile" subtitle={company.shortName} />

      <main className="space-y-4 px-4 py-5 pb-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <Link
              href="/notifications"
              className="relative shrink-0"
              aria-label={
                unread > 0
                  ? `Profile notifications, ${unread} unread`
                  : "Notifications"
              }
            >
              <Avatar className="size-16 border-2 border-white/20">
                <AvatarFallback className="bg-sky-500 text-xl font-bold text-white">
                  {initials(worker.name)}
                </AvatarFallback>
              </Avatar>
              <UnreadCountBadge
                count={unread}
                ringClassName="ring-slate-900"
                className="-top-1 -right-1 h-5 min-w-5 text-[10px]"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">
                {worker.defaultRole}
              </p>
              <h2 className="mt-1 text-xl font-bold leading-tight tracking-tight">
                {worker.name}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                #{worker.employeeNumber} · {worker.trade}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {worker.crew}
                {hireLabel ? ` · Hired ${hireLabel}` : ""}
              </p>
            </div>
            <Link
              href="/notifications"
              className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10"
              aria-label={
                unread > 0
                  ? `Notifications, ${unread} unread`
                  : "Notifications"
              }
            >
              <Bell className="size-5" />
              <UnreadCountBadge count={unread} ringClassName="ring-slate-900" />
            </Link>
          </div>
          <div className="relative mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/10 px-3 py-2.5 text-center">
              <p className="font-mono text-lg font-bold tabular-nums">
                {compliance?.percent ?? "—"}
                {compliance ? "%" : ""}
              </p>
              <p className="text-[10px] text-slate-300">COR certs</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2.5 text-center">
              <p className="font-mono text-lg font-bold tabular-nums">
                {trackPct}%
              </p>
              <p className="text-[10px] text-slate-300">Pathway</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2.5 text-center">
              <p className="font-mono text-lg font-bold tabular-nums">
                {activity?.hours ?? "—"}
                {activity ? "h" : ""}
              </p>
              <p className="text-[10px] text-slate-300">30-day hrs</p>
            </div>
          </div>
        </div>

        <InstallAppCard />

        {/* Clock status */}
        <Link
          href="/timeclock"
          className={cn(
            "helix-card flex items-center gap-3 p-4 active:scale-[0.99]",
            activeVisit && "ring-2 ring-emerald-500/30"
          )}
        >
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl",
              activeVisit
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Clock className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold">
              {activeVisit ? "Clocked in" : "Not on the clock"}
            </p>
            <p className="text-sm text-muted-foreground">
              {activeVisit
                ? `Since ${new Date(activeVisit.clockIn).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} · ${visitsToday} visit${visitsToday === 1 ? "" : "s"} today`
                : `${visitsToday} visit${visitsToday === 1 ? "" : "s"} today · Open time clock`}
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>

        {/* COR compliance */}
        {compliance && (
          <section className="helix-card space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <div>
                  <p className="font-bold">Role compliance</p>
                  <p className="text-xs text-muted-foreground">
                    {compliance.metCount}/{compliance.requiredCount}{" "}
                    requirements for {member?.role ?? worker.defaultRole}
                  </p>
                </div>
              </div>
              <Badge
                className={cn(
                  "border-0",
                  compliance.compliant
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                )}
              >
                {compliance.compliant ? "Compliant" : "Gaps"}
              </Badge>
            </div>
            <Progress value={compliance.percent} className="h-2.5" />
            {compliance.missing.length > 0 && (
              <div className="rounded-xl bg-rose-500/10 px-3 py-2.5 text-sm">
                <p className="font-semibold text-rose-700 dark:text-rose-400">
                  Missing
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {compliance.missing
                    .map((m) => m.requirement.name)
                    .join(", ")}
                </p>
              </div>
            )}
            <Button asChild variant="outline" className="h-11 w-full rounded-xl">
              <Link href="/statistics">Open COR worker stats</Link>
            </Button>
          </section>
        )}

        {/* Competency */}
        <section className="helix-card space-y-3 p-4">
          <div className="flex items-center gap-2">
            <HardHat className="size-5 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Continuous evaluations</p>
              <p className="text-xs text-muted-foreground">
                {primaryTrack
                  ? `${primaryTrack.title} · ${passed.size} checklist${passed.size === 1 ? "" : "s"} signed`
                  : "Rigger & operator pathways"}
              </p>
            </div>
          </div>
          {primaryTrack && (
            <>
              <Progress value={trackPct} className="h-2.5" />
              <p className="text-xs text-muted-foreground">
                {trackPct}% of {primaryTrack.title} complete
              </p>
            </>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button asChild className="h-11 rounded-xl font-semibold">
              <Link href={`/evaluations/member/${memberId}`}>My pathway</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/evaluations">All evals</Link>
            </Button>
          </div>
        </section>

        {/* Activity */}
        <section className="helix-card space-y-2 p-4">
          <p className="mb-1 font-bold">My activity</p>
          <LinkRow
            href="/statistics"
            icon={ClipboardList}
            title="Work statistics"
            subtitle={
              activity
                ? `${activity.flhas} FLHAs · top: ${activity.topTasks[0]?.label ?? "—"}`
                : "FLHA tasks & hours"
            }
            value={activity ? `${activity.hours}h` : undefined}
            tone="bg-orange-500/15 text-orange-700 dark:text-orange-400"
          />
          <LinkRow
            href="/forms/toolbox"
            icon={Megaphone}
            title="Toolbox talks"
            subtitle={`${talksAttended} attended · ${talksFacilitated} facilitated`}
            value={String(myTalks.length)}
            tone="bg-amber-500/15 text-amber-700 dark:text-amber-400"
          />
          <LinkRow
            href="/forms/site-inspections"
            icon={MapPinned}
            title="Site inspections"
            subtitle="Walkthroughs as inspector"
            value={String(inspectionsLed)}
            tone="bg-sky-500/15 text-sky-700 dark:text-sky-400"
          />
          <LinkRow
            href="/forms"
            icon={BookOpen}
            title="Document reviews"
            subtitle="SWP / SJP quizzes completed"
            value={String(reviews.records.length)}
            tone="bg-violet-500/15 text-violet-700 dark:text-violet-400"
          />
          <LinkRow
            href="/forms/flha"
            icon={ClipboardCheck}
            title="FLHA"
            subtitle="Start or continue today’s assessment"
            tone="bg-primary/15 text-primary"
          />
          <LinkRow
            href="/notifications"
            icon={Bell}
            title="Notifications"
            subtitle={
              unread > 0
                ? `${unread} unread company update${unread === 1 ? "" : "s"}`
                : "All caught up"
            }
            value={unread > 0 ? String(unread) : undefined}
            tone="bg-rose-500/15 text-rose-700 dark:text-rose-400"
          />
        </section>

        {/* Crew */}
        <section className="helix-card space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <p className="font-bold">Crew & supervision</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Assigned crew</span>
              <span className="text-right font-semibold">{worker.crew}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Supervisor</span>
              <span className="text-right font-semibold">
                {worker.supervisor}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Today&apos;s crew</span>
              <span className="text-right font-semibold">
                {todayCrew > 0 ? `${todayCrew} selected` : "Not set"}
              </span>
            </div>
            {crews.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {crews.map((c) => (
                  <Badge key={c.id} variant="secondary" className="rounded-full">
                    {c.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button asChild className="h-11 w-full rounded-xl font-semibold">
            <Link href="/team">Manage My Team</Link>
          </Button>
        </section>

        {/* Certifications */}
        <section className="helix-card space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-primary" />
            <div>
              <p className="font-bold">Certifications</p>
              <p className="text-xs text-muted-foreground">
                {certs.length} on file · tap COR stats for role gaps
              </p>
            </div>
          </div>
          <CertGrid certs={certs} />
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {certs.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Roles */}
        <section className="helix-card space-y-3 p-4">
          <p className="font-bold">Qualified roles</p>
          <div className="flex flex-wrap gap-2">
            {worker.roles.map((r) => (
              <Badge
                key={r}
                variant={r === worker.defaultRole ? "default" : "outline"}
                className="rounded-full px-3 py-1.5"
              >
                {r}
                {r === worker.defaultRole ? " · default" : ""}
              </Badge>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="helix-card space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Phone className="size-5 text-primary" />
            <p className="font-bold">Contact</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Mobile</span>
              <a
                href={`tel:${worker.phone}`}
                className="font-semibold text-primary"
              >
                {worker.phone}
              </a>
            </div>
            {worker.email && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Email</span>
                <a
                  href={`mailto:${worker.email}`}
                  className="truncate font-semibold text-primary"
                >
                  {worker.email}
                </a>
              </div>
            )}
            {worker.emergencyContact && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Emergency</span>
                <span className="text-right font-semibold">
                  {worker.emergencyContact}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Company</span>
              <a
                href={`tel:${company.phone}`}
                className="font-semibold text-primary"
              >
                {company.phone}
              </a>
            </div>
            <p className="text-xs text-muted-foreground">{company.address}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
