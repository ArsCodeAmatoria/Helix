/** Basic scientific expression evaluator (degrees for trig). */

export type AngleMode = "deg" | "rad";

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0 || n > 170) return NaN;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function tokenize(expr: string): string[] {
  const src = expr.replace(/\s+/g, "").replace(/π/g, "pi").replace(/×/g, "*").replace(/÷/g, "/");
  const tokens: string[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/[0-9.]/.test(c)) {
      let j = i + 1;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      tokens.push(src.slice(i, j));
      i = j;
      continue;
    }
    if (/[a-z]/i.test(c)) {
      let j = i + 1;
      while (j < src.length && /[a-z]/i.test(src[j])) j++;
      tokens.push(src.slice(i, j).toLowerCase());
      i = j;
      continue;
    }
    if ("+-*/^%(),!".includes(c)) {
      tokens.push(c);
      i++;
      continue;
    }
    throw new Error(`Unexpected “${c}”`);
  }
  return tokens;
}

type RpnToken = { type: "num"; value: number } | { type: "op"; value: string };

const PRECEDENCE: Record<string, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "%": 2,
  "^": 3,
  "u-": 4,
  "!": 5,
};

const RIGHT_ASSOC = new Set(["^", "u-"]);

const FUNCTIONS = new Set([
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sqrt",
  "ln",
  "log",
  "abs",
  "exp",
]);

function toRpn(tokens: string[]): RpnToken[] {
  const output: RpnToken[] = [];
  const stack: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = i > 0 ? tokens[i - 1] : undefined;

    if (/^\d*\.?\d+$/.test(t)) {
      output.push({ type: "num", value: Number(t) });
      continue;
    }
    if (t === "pi") {
      output.push({ type: "num", value: Math.PI });
      continue;
    }
    if (t === "e" && (prev === undefined || "+-*/^%(,".includes(prev))) {
      output.push({ type: "num", value: Math.E });
      continue;
    }
    if (FUNCTIONS.has(t)) {
      stack.push(t);
      continue;
    }
    if (t === "(") {
      stack.push(t);
      continue;
    }
    if (t === ")") {
      while (stack.length && stack[stack.length - 1] !== "(") {
        output.push({ type: "op", value: stack.pop()! });
      }
      if (!stack.length) throw new Error("Mismatched parentheses");
      stack.pop();
      if (stack.length && FUNCTIONS.has(stack[stack.length - 1])) {
        output.push({ type: "op", value: stack.pop()! });
      }
      continue;
    }
    if (t === "!") {
      output.push({ type: "op", value: "!" });
      continue;
    }

    let op = t;
    if (
      op === "-" &&
      (prev === undefined || "+-*/^%(,".includes(prev) || FUNCTIONS.has(prev ?? ""))
    ) {
      op = "u-";
    }

    while (stack.length) {
      const top = stack[stack.length - 1];
      if (top === "(" || FUNCTIONS.has(top)) break;
      const pTop = PRECEDENCE[top] ?? 0;
      const pOp = PRECEDENCE[op] ?? 0;
      if (pTop > pOp || (pTop === pOp && !RIGHT_ASSOC.has(op))) {
        output.push({ type: "op", value: stack.pop()! });
      } else break;
    }
    stack.push(op);
  }

  while (stack.length) {
    const top = stack.pop()!;
    if (top === "(" || top === ")") throw new Error("Mismatched parentheses");
    output.push({ type: "op", value: top });
  }
  return output;
}

function applyUnary(fn: string, x: number, mode: AngleMode): number {
  const toRad = mode === "deg" ? (x * Math.PI) / 180 : x;
  const fromRad = (r: number) => (mode === "deg" ? (r * 180) / Math.PI : r);
  switch (fn) {
    case "sin":
      return Math.sin(toRad);
    case "cos":
      return Math.cos(toRad);
    case "tan":
      return Math.tan(toRad);
    case "asin":
      return fromRad(Math.asin(x));
    case "acos":
      return fromRad(Math.acos(x));
    case "atan":
      return fromRad(Math.atan(x));
    case "sqrt":
      return Math.sqrt(x);
    case "ln":
      return Math.log(x);
    case "log":
      return Math.log10(x);
    case "abs":
      return Math.abs(x);
    case "exp":
      return Math.exp(x);
    case "u-":
      return -x;
    case "!":
      return factorial(x);
    default:
      return NaN;
  }
}

function evalRpn(rpn: RpnToken[], mode: AngleMode): number {
  const stack: number[] = [];
  for (const t of rpn) {
    if (t.type === "num") {
      stack.push(t.value);
      continue;
    }
    const op = t.value;
    if (FUNCTIONS.has(op) || op === "u-" || op === "!") {
      if (!stack.length) throw new Error("Incomplete expression");
      stack.push(applyUnary(op, stack.pop()!, mode));
      continue;
    }
    if (stack.length < 2) throw new Error("Incomplete expression");
    const b = stack.pop()!;
    const a = stack.pop()!;
    switch (op) {
      case "+":
        stack.push(a + b);
        break;
      case "-":
        stack.push(a - b);
        break;
      case "*":
        stack.push(a * b);
        break;
      case "/":
        stack.push(a / b);
        break;
      case "%":
        stack.push(a % b);
        break;
      case "^":
        stack.push(Math.pow(a, b));
        break;
      default:
        throw new Error(`Unknown operator ${op}`);
    }
  }
  if (stack.length !== 1) throw new Error("Incomplete expression");
  return stack[0];
}

export function evaluateExpression(
  expr: string,
  mode: AngleMode = "deg"
): number {
  const trimmed = expr.trim();
  if (!trimmed) return NaN;
  const rpn = toRpn(tokenize(trimmed));
  return evalRpn(rpn, mode);
}

export function formatCalcDisplay(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  if (Object.is(n, -0)) return "0";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e10 || abs < 1e-7)) {
    return n.toExponential(6).replace(/\.?0+e/, "e");
  }
  const s = Number(n.toPrecision(12)).toString();
  return s;
}
