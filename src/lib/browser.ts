export type BrowserKind =
  | "chrome"
  | "edge"
  | "safari"
  | "firefox"
  | "samsung"
  | "other";

export function detectBrowser(): {
  kind: BrowserKind;
  label: string;
  isChromium: boolean;
  isIos: boolean;
} {
  if (typeof window === "undefined") {
    return {
      kind: "other",
      label: "Browser",
      isChromium: false,
      isIos: false,
    };
  }

  const ua = window.navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Order matters: Edge/Samsung include Chrome in UA
  if (/Edg\//.test(ua)) {
    return { kind: "edge", label: "Microsoft Edge", isChromium: true, isIos: iOS };
  }
  if (/SamsungBrowser\//.test(ua)) {
    return {
      kind: "samsung",
      label: "Samsung Internet",
      isChromium: true,
      isIos: iOS,
    };
  }
  if (/Firefox\//.test(ua)) {
    return { kind: "firefox", label: "Firefox", isChromium: false, isIos: iOS };
  }
  if (iOS && /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)) {
    return { kind: "safari", label: "Safari", isChromium: false, isIos: true };
  }
  if (/CriOS\//.test(ua)) {
    return { kind: "chrome", label: "Chrome", isChromium: true, isIos: true };
  }
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) {
    return { kind: "chrome", label: "Google Chrome", isChromium: true, isIos: iOS };
  }
  if (/Safari\//.test(ua)) {
    return { kind: "safari", label: "Safari", isChromium: false, isIos: iOS };
  }

  return { kind: "other", label: "Browser", isChromium: false, isIos: iOS };
}

export function installStepsForBrowser(kind: BrowserKind): string[] {
  switch (kind) {
    case "chrome":
      return [
        "Tap Install when Chrome asks, or open the ⋮ menu",
        "Choose Install app / Install Proven",
        "Confirm — the fingerprint icon appears on your home screen",
      ];
    case "edge":
      return [
        "Tap Install app when Edge asks, or open the … menu",
        "Choose Apps → Install this site as an app",
        "Confirm — Proven opens like a native app",
      ];
    case "safari":
      return [
        "Tap the Share button in Safari",
        "Choose Add to Home Screen",
        "Tap Add — Proven installs with the fingerprint icon",
      ];
    case "samsung":
      return [
        "Tap the menu ⋮ in Samsung Internet",
        "Choose Add page to → Home screen",
        "Confirm the Proven icon",
      ];
    case "firefox":
      return [
        "Tap the menu ⋮ in Firefox",
        "Choose Install / Add to Home screen if available",
        "Or use Chrome/Edge for the one-tap install prompt",
      ];
    default:
      return [
        "Open the browser menu",
        "Look for Install app or Add to Home screen",
        "Confirm to add the Proven icon",
      ];
  }
}
