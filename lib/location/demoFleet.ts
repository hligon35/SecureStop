export type DemoFleetMode = {
  enabled: boolean;
  isLocked: boolean;
  source: "env" | "manual" | "default";
};

function parseDemoFleetFlag(flag?: string | null): boolean | undefined {
  const value = flag?.trim().toLowerCase();
  if (!value) return undefined;
  if (value === "1" || value === "true" || value === "yes" || value === "on") {
    return true;
  }
  if (value === "0" || value === "false" || value === "no" || value === "off") {
    return false;
  }
  return undefined;
}

export function resolveDemoFleetMode(input: {
  envFlag?: string | null;
  override?: boolean;
}): DemoFleetMode {
  const envEnabled = parseDemoFleetFlag(input.envFlag);

  if (typeof envEnabled === "boolean") {
    return {
      enabled: envEnabled,
      isLocked: true,
      source: "env",
    };
  }

  if (typeof input.override === "boolean") {
    return {
      enabled: input.override,
      isLocked: false,
      source: "manual",
    };
  }

  return {
    enabled: false,
    isLocked: false,
    source: "default",
  };
}

export function formatDemoFleetMenuTitle(mode: DemoFleetMode): string {
  const state = mode.enabled ? "ON" : "OFF";

  if (mode.isLocked) {
    return `Fleet demo: ${state} (locked by env)`;
  }

  if (mode.source === "manual") {
    return `Fleet demo: ${state} (manual)`;
  }

  return `Fleet demo: ${state} (default off)`;
}
