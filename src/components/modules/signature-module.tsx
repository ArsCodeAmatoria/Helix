"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eraser, MapPin, Plus, Trash2, UserPlus, Users } from "lucide-react";
import type { SignatureData, SignerEntry, SignerRole } from "@/lib/types";
import { useTeamOptional } from "@/components/providers/team-provider";
import { memberToSignerRole } from "@/lib/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const SIGNER_ROLES: SignerRole[] = [
  "Worker",
  "Supervisor",
  "Safety Coordinator",
  "Rigger",
  "Crane Operator",
  "Crew Member",
  "Other",
];

interface SignaturePadProps {
  value: string | null;
  onChange: (dataUrl: string) => void;
}

function SignaturePad({ value, onChange }: SignaturePadProps) {
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Signature</Label>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          <Eraser className="size-4" />
          Clear
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={220}
        className="h-32 w-full touch-none rounded-2xl border-2 border-dashed border-border bg-slate-50 dark:bg-slate-100"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
    </div>
  );
}

interface SignerCardProps {
  index: number;
  signer: SignerEntry;
  canRemove: boolean;
  onUpdate: (patch: Partial<SignerEntry>) => void;
  onRemove: () => void;
}

function SignerCard({
  index,
  signer,
  canRemove,
  onUpdate,
  onRemove,
}: SignerCardProps) {
  const done = Boolean(signer.name.trim() && signer.signature);

  return (
    <div
      className={cn(
        "helix-card space-y-4 p-4",
        done && "ring-2 ring-emerald-500/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold">
          Signer {index + 1}
          {done && (
            <span className="ml-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Signed
            </span>
          )}
        </p>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 text-destructive"
            onClick={onRemove}
            aria-label="Remove signer"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`name-${signer.id}`}>Full name</Label>
        <Input
          id={`name-${signer.id}`}
          className="h-12 rounded-xl text-base"
          value={signer.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Enter name"
          autoComplete="name"
        />
      </div>

      <div>
        <Label className="mb-2 block">Role</Label>
        <div className="flex flex-wrap gap-2">
          {SIGNER_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => onUpdate({ role })}
              className={cn(
                "min-h-10 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
                signer.role === role
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted/60 text-foreground hover:border-primary/40"
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <SignaturePad
        value={signer.signature}
        onChange={(dataUrl) => onUpdate({ signature: dataUrl || null })}
      />

      {signer.signedAt && (
        <p className="text-xs text-muted-foreground">
          Signed {new Date(signer.signedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

interface SignatureModuleProps {
  signatures: SignatureData;
  onEnsureDefaults: () => void;
  onAdd: (partial?: Partial<Omit<SignerEntry, "id">>) => void;
  onUpdate: (id: string, patch: Partial<SignerEntry>) => void;
  onRemove: (id: string) => void;
  onCaptureGps: () => void;
  onLoadTeam?: (
    signers: Array<{ name: string; role: SignerRole; signature?: string | null }>
  ) => void;
}

export function SignatureModule({
  signatures,
  onEnsureDefaults,
  onAdd,
  onUpdate,
  onRemove,
  onCaptureGps,
  onLoadTeam,
}: SignatureModuleProps) {
  const team = useTeamOptional();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    onEnsureDefaults();
  }, [onEnsureDefaults]);

  if (!ready) return null;

  const usedNames = new Set(
    signatures.signers.map((s) => s.name.trim().toLowerCase()).filter(Boolean)
  );

  const teamSuggestions =
    team?.todaysMembers
      .filter((m) => !usedNames.has(m.name.toLowerCase()))
      .map((m) => ({
        name: m.name,
        role: memberToSignerRole(m.role),
        signature:
          team.signatures.find((s) => s.memberId === m.id)?.signature ?? null,
      })) ?? [];

  const signedCount = signatures.signers.filter(
    (s) => s.name.trim() && s.signature
  ).length;

  const loadTodaysTeam = () => {
    if (!team || !onLoadTeam) return;
    onLoadTeam(
      team.todaysMembers.map((m) => {
        const existing = team.signatures.find((s) => s.memberId === m.id);
        return {
          name: m.name,
          role: memberToSignerRole(m.role),
          signature: existing?.signature ?? null,
        };
      })
    );
  };

  return (
    <div className="space-y-5">
      <div className="helix-card space-y-3 p-4">
        <p className="font-bold">Crew acknowledgements</p>
        <p className="text-sm text-muted-foreground">
          Everyone on today&apos;s crew should print their name and sign.{" "}
          {signedCount} of {signatures.signers.length || 0} complete.
        </p>
        {team && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Active crew: {team.selectedCrew?.name} · {team.todaysMembers.length}{" "}
              selected
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                className="h-12 rounded-xl font-semibold"
                disabled={team.todaysMembers.length === 0}
                onClick={loadTodaysTeam}
              >
                <Users className="size-4" />
                Load team
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl font-semibold"
                asChild
              >
                <Link href="/team">Manage team</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {teamSuggestions.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">
            Quick add from today&apos;s team
          </p>
          <div className="flex flex-wrap gap-2">
            {teamSuggestions.map((person) => (
              <button
                key={person.name}
                type="button"
                onClick={() =>
                  onAdd({
                    name: person.name,
                    role: person.role,
                    signature: person.signature,
                    signedAt: person.signature
                      ? new Date().toISOString()
                      : null,
                  })
                }
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-semibold shadow-sm active:scale-[0.98]"
              >
                <UserPlus className="size-4 text-primary" />
                {person.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {signatures.signers.map((signer, index) => (
          <SignerCard
            key={signer.id}
            index={index}
            signer={signer}
            canRemove={signatures.signers.length > 1}
            onUpdate={(patch) => onUpdate(signer.id, patch)}
            onRemove={() => onRemove(signer.id)}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-14 w-full rounded-2xl text-base font-semibold"
        onClick={() => onAdd({ role: "Crew Member" })}
      >
        <Plus className="size-5" />
        Add another signer
      </Button>

      <div className="helix-card space-y-3 p-4">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-xl"
          onClick={onCaptureGps}
        >
          <MapPin className="size-4" />
          Capture GPS location
        </Button>
        {signatures.gps && (
          <p className="text-sm text-muted-foreground">
            GPS: {signatures.gps.lat.toFixed(5)}, {signatures.gps.lng.toFixed(5)}
          </p>
        )}
        {signatures.timestamp && (
          <p className="text-sm text-muted-foreground">
            Last signed: {new Date(signatures.timestamp).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
