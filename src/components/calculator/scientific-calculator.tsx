"use client";

import { useCallback, useState } from "react";
import {
  evaluateExpression,
  formatCalcDisplay,
  type AngleMode,
} from "@/lib/scientific-calc";
import { cn } from "@/lib/utils";

type KeyDef = {
  label: string;
  insert?: string;
  action?: "ac" | "del" | "eq" | "toggle-sign" | "deg" | "rad";
  span?: 1 | 2;
  tone?: "num" | "op" | "fn" | "eq" | "danger";
};

const ROWS: KeyDef[][] = [
  [
    { label: "AC", action: "ac", tone: "danger" },
    { label: "⌫", action: "del", tone: "fn" },
    { label: "(", insert: "(", tone: "fn" },
    { label: ")", insert: ")", tone: "fn" },
    { label: "÷", insert: "÷", tone: "op" },
  ],
  [
    { label: "sin", insert: "sin(", tone: "fn" },
    { label: "cos", insert: "cos(", tone: "fn" },
    { label: "tan", insert: "tan(", tone: "fn" },
    { label: "^", insert: "^", tone: "fn" },
    { label: "×", insert: "×", tone: "op" },
  ],
  [
    { label: "√", insert: "sqrt(", tone: "fn" },
    { label: "7", insert: "7", tone: "num" },
    { label: "8", insert: "8", tone: "num" },
    { label: "9", insert: "9", tone: "num" },
    { label: "−", insert: "-", tone: "op" },
  ],
  [
    { label: "ln", insert: "ln(", tone: "fn" },
    { label: "4", insert: "4", tone: "num" },
    { label: "5", insert: "5", tone: "num" },
    { label: "6", insert: "6", tone: "num" },
    { label: "+", insert: "+", tone: "op" },
  ],
  [
    { label: "log", insert: "log(", tone: "fn" },
    { label: "1", insert: "1", tone: "num" },
    { label: "2", insert: "2", tone: "num" },
    { label: "3", insert: "3", tone: "num" },
    { label: "±", action: "toggle-sign", tone: "op" },
  ],
  [
    { label: "π", insert: "π", tone: "fn" },
    { label: "0", insert: "0", tone: "num", span: 2 },
    { label: ".", insert: ".", tone: "num" },
    { label: "=", action: "eq", tone: "eq" },
  ],
];

function keyClass(tone: KeyDef["tone"]) {
  switch (tone) {
    case "eq":
      return "bg-primary text-primary-foreground shadow-md active:bg-primary/90";
    case "op":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300 active:bg-sky-500/25";
    case "fn":
      return "bg-muted text-foreground active:bg-muted/80";
    case "danger":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300 active:bg-rose-500/25";
    default:
      return "bg-card text-foreground ring-1 ring-border/50 active:bg-muted";
  }
}

export function ScientificCalculator({ className }: { className?: string }) {
  const [expr, setExpr] = useState("");
  const [display, setDisplay] = useState("0");
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [mode, setMode] = useState<AngleMode>("deg");
  const [error, setError] = useState(false);

  const append = useCallback(
    (chunk: string) => {
      setError(false);
      setExpr((prev) => {
        const next =
          justEvaluated && /[0-9.π]/.test(chunk) ? chunk : prev + chunk;
        setJustEvaluated(false);
        setDisplay(next || "0");
        return next;
      });
    },
    [justEvaluated]
  );

  const clearAll = () => {
    setExpr("");
    setDisplay("0");
    setJustEvaluated(false);
    setError(false);
  };

  const backspace = () => {
    if (justEvaluated) {
      clearAll();
      return;
    }
    setExpr((prev) => {
      const next = prev.slice(0, -1);
      setDisplay(next || "0");
      setError(false);
      return next;
    });
  };

  const evaluate = () => {
    if (!expr.trim()) return;
    try {
      const value = evaluateExpression(expr, mode);
      const formatted = formatCalcDisplay(value);
      if (formatted === "Error") {
        setDisplay("Error");
        setError(true);
        setJustEvaluated(true);
        return;
      }
      setDisplay(formatted);
      setExpr(formatted);
      setJustEvaluated(true);
      setError(false);
    } catch {
      setDisplay("Error");
      setError(true);
      setJustEvaluated(true);
    }
  };

  const toggleSign = () => {
    setExpr((prev) => {
      if (!prev) return prev;
      let next: string;
      if (prev.startsWith("-(") && prev.endsWith(")")) {
        next = prev.slice(2, -1);
      } else if (
        prev.startsWith("-") &&
        !prev.slice(1).includes("+") &&
        !prev.slice(1).includes("-")
      ) {
        next = prev.slice(1);
      } else {
        next = `-(${prev})`;
      }
      setDisplay(next);
      setJustEvaluated(false);
      setError(false);
      return next;
    });
  };

  const onKey = (key: KeyDef) => {
    if (key.action === "ac") return clearAll();
    if (key.action === "del") return backspace();
    if (key.action === "eq") return evaluate();
    if (key.action === "toggle-sign") return toggleSign();
    if (key.insert) append(key.insert);
  };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden",
        className
      )}
    >
      {/* Sticky display */}
      <div className="sticky top-0 z-10 shrink-0 rounded-2xl bg-slate-950 px-3.5 py-3 text-right text-white shadow-inner">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex rounded-full bg-white/10 p-0.5">
            {(["deg", "rad"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                  mode === m
                    ? "bg-white text-slate-950"
                    : "text-slate-400"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-400">
            {expr || " "}
          </p>
        </div>
        <p
          className={cn(
            "break-all font-mono text-[1.85rem] font-bold tabular-nums leading-none tracking-tight",
            error && "text-rose-400"
          )}
        >
          {display}
        </p>
      </div>

      {/* Keypad fills remaining height */}
      <div className="grid min-h-0 flex-1 grid-rows-6 gap-1.5">
        {ROWS.map((row, ri) => (
          <div key={ri} className="grid min-h-0 grid-cols-5 gap-1.5">
            {row.map((key) => (
              <button
                key={key.label + (key.insert ?? key.action)}
                type="button"
                onClick={() => onKey(key)}
                className={cn(
                  "flex min-h-0 items-center justify-center rounded-2xl text-[13px] font-bold transition-transform active:scale-[0.97]",
                  key.span === 2 && "col-span-2",
                  keyClass(key.tone)
                )}
              >
                {key.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
