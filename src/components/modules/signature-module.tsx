"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, MapPin } from "lucide-react";
import type { SignatureData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface SignaturePadProps {
  label: string;
  value: string | null;
  onChange: (dataUrl: string) => void;
}

function SignaturePad({ label, value, onChange }: SignaturePadProps) {
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
    // Only paint on mount / when value cleared externally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{label}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          <Eraser className="size-4" />
          Clear
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={220}
        className="h-36 w-full touch-none rounded-2xl border-2 border-dashed border-border bg-slate-50 dark:bg-slate-100"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
    </div>
  );
}

interface SignatureModuleProps {
  signatures: SignatureData;
  onWorkerSign: (dataUrl: string) => void;
  onSupervisorSign: (dataUrl: string) => void;
  onCaptureGps: () => void;
}

export function SignatureModule({
  signatures,
  onWorkerSign,
  onSupervisorSign,
  onCaptureGps,
}: SignatureModuleProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const handleWorker = useCallback(
    (dataUrl: string) => {
      if (dataUrl) onWorkerSign(dataUrl);
    },
    [onWorkerSign]
  );

  const handleSupervisor = useCallback(
    (dataUrl: string) => {
      if (dataUrl) onSupervisorSign(dataUrl);
    },
    [onSupervisorSign]
  );

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <SignaturePad
        label="Worker signature"
        value={signatures.worker}
        onChange={handleWorker}
      />
      <SignaturePad
        label="Supervisor signature"
        value={signatures.supervisor}
        onChange={handleSupervisor}
      />
      <Card>
        <CardContent className="space-y-3 p-4">
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
              Signed: {new Date(signatures.timestamp).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
