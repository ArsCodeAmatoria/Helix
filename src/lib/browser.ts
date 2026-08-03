export type BrowserKind =
  | "chrome"
  | "edge"
  | "safari"
  | "firefox"
  | "samsung"
  | "other";

export type DevicePlatform = "ios" | "android" | "desktop";

export type InstallProfile = {
  kind: BrowserKind;
  platform: DevicePlatform;
  /** e.g. "Google Chrome on Android" */
  label: string;
  shortLabel: string;
  isChromium: boolean;
  /** Native beforeinstallprompt can work (Android/desktop Chromium). */
  supportsNativeInstall: boolean;
  steps: string[];
  summary: string;
};

function detectPlatform(ua: string): DevicePlatform {
  if (/Android/i.test(ua)) return "android";
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    (typeof navigator !== "undefined" &&
      navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }
  return "desktop";
}

function detectKind(ua: string, platform: DevicePlatform): BrowserKind {
  // iOS browsers report as CriOS / FxiOS / EdgiOS / Safari
  if (/Edg(?:A|iOS)?\//.test(ua) || /EdgiOS\//.test(ua)) return "edge";
  if (/SamsungBrowser\//.test(ua)) return "samsung";
  if (/FxiOS\//.test(ua) || /Firefox\//.test(ua)) return "firefox";
  if (/CriOS\//.test(ua)) return "chrome";
  if (platform === "ios") {
    // Bare iOS Safari (no CriOS/FxiOS/EdgiOS)
    if (/Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome\//.test(ua)) {
      return "safari";
    }
    // Some iOS browsers still include "Safari" + "Chrome" tokens incorrectly —
    // prefer Chrome if CriOS missing but Chrome/ present on non-iOS only.
  }
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "safari";
  return "other";
}

function buildSteps(
  kind: BrowserKind,
  platform: DevicePlatform
): { steps: string[]; summary: string; label: string; shortLabel: string } {
  if (kind === "chrome" && platform === "android") {
    return {
      shortLabel: "Chrome",
      label: "Google Chrome on Android",
      summary:
        "Chrome can install Proven with one tap. Tap Install when prompted.",
      steps: [
        "Tap Install Proven now (Chrome will show its install sheet)",
        "Or open the ⋮ menu → Install app / Add to Home screen",
        "Confirm — the fingerprint icon appears on your home screen",
      ],
    };
  }
  if (kind === "chrome" && platform === "ios") {
    return {
      shortLabel: "Chrome",
      label: "Chrome on iPhone",
      summary:
        "On iPhone, Chrome uses Add to Home Screen. The icon still installs to your home screen.",
      steps: [
        "Tap the Share icon in Chrome’s address bar / toolbar",
        "Scroll and tap Add to Home Screen",
        "Tap Add — Proven opens with the fingerprint icon",
      ],
    };
  }
  if (kind === "chrome" && platform === "desktop") {
    return {
      shortLabel: "Chrome",
      label: "Google Chrome",
      summary: "Chrome can install Proven as an app from this page.",
      steps: [
        "Tap Install Proven now when Chrome asks",
        "Or open ⋮ → Cast, save, and share → Install page…",
        "Confirm — Proven launches like a desktop app",
      ],
    };
  }
  if (kind === "edge" && platform === "android") {
    return {
      shortLabel: "Edge",
      label: "Microsoft Edge on Android",
      summary: "Edge can install Proven to your home screen.",
      steps: [
        "Tap Install Proven now when Edge prompts you",
        "Or open … menu → Add to phone → Install",
        "Confirm the Proven fingerprint icon",
      ],
    };
  }
  if (kind === "edge" && platform === "ios") {
    return {
      shortLabel: "Edge",
      label: "Edge on iPhone",
      summary: "Use Share → Add to Home Screen in Edge on iPhone.",
      steps: [
        "Tap Share in Edge",
        "Choose Add to Home Screen",
        "Tap Add to install Proven",
      ],
    };
  }
  if (kind === "edge") {
    return {
      shortLabel: "Edge",
      label: "Microsoft Edge",
      summary: "Edge can install Proven as an app.",
      steps: [
        "Tap Install Proven now when Edge asks",
        "Or open … → Apps → Install this site as an app",
        "Confirm to add Proven",
      ],
    };
  }
  if (kind === "safari") {
    return {
      shortLabel: "Safari",
      label: "Safari on iPhone",
      summary: "In Safari, use Share → Add to Home Screen.",
      steps: [
        "Tap the Share button at the bottom of Safari",
        "Scroll and tap Add to Home Screen",
        "Tap Add — Proven installs with the fingerprint icon",
      ],
    };
  }
  if (kind === "samsung") {
    return {
      shortLabel: "Samsung Internet",
      label: "Samsung Internet",
      summary: "Add Proven from the Samsung Internet menu.",
      steps: [
        "Tap the menu ⋮ in Samsung Internet",
        "Tap Add page to → Home screen",
        "Confirm the Proven icon",
      ],
    };
  }
  if (kind === "firefox" && platform === "android") {
    return {
      shortLabel: "Firefox",
      label: "Firefox on Android",
      summary: "Install from the Firefox menu, or use Chrome for one-tap install.",
      steps: [
        "Tap the menu ⋮ in Firefox",
        "Tap Install or Add to Home screen if shown",
        "For the fastest install, open this page in Chrome",
      ],
    };
  }
  if (kind === "firefox" && platform === "ios") {
    return {
      shortLabel: "Firefox",
      label: "Firefox on iPhone",
      summary: "Use Share → Add to Home Screen in Firefox on iPhone.",
      steps: [
        "Tap the Share / menu control in Firefox",
        "Tap Add to Home Screen",
        "Tap Add to install Proven",
      ],
    };
  }
  return {
    shortLabel: "Browser",
    label: "Your browser",
    summary: "Use your browser’s Install app or Add to Home Screen option.",
    steps: [
      "Open your browser menu",
      "Choose Install app or Add to Home Screen",
      "Confirm to add the Proven icon",
    ],
  };
}

export function detectBrowser(): InstallProfile {
  if (typeof window === "undefined") {
    return {
      kind: "other",
      platform: "desktop",
      label: "Browser",
      shortLabel: "Browser",
      isChromium: false,
      supportsNativeInstall: false,
      steps: [],
      summary: "",
    };
  }

  const ua = window.navigator.userAgent;
  const platform = detectPlatform(ua);
  const kind = detectKind(ua, platform);
  const copy = buildSteps(kind, platform);
  const isChromium =
    kind === "chrome" || kind === "edge" || kind === "samsung";
  // Native BIP only on Chromium outside iOS (WebKit blocks it on iPhone).
  const supportsNativeInstall = isChromium && platform !== "ios";

  return {
    kind,
    platform,
    label: copy.label,
    shortLabel: copy.shortLabel,
    isChromium,
    supportsNativeInstall,
    steps: copy.steps,
    summary: copy.summary,
  };
}

/** @deprecated Prefer detectBrowser().steps */
export function installStepsForBrowser(
  kind: BrowserKind,
  platform: DevicePlatform = "android"
): string[] {
  return buildSteps(kind, platform).steps;
}
