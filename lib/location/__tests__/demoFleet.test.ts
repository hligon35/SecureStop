import { formatDemoFleetMenuTitle, resolveDemoFleetMode } from "../demoFleet";

describe("resolveDemoFleetMode", () => {
  it("defaults the fleet demo off when nothing explicitly enables it", () => {
    expect(resolveDemoFleetMode({})).toEqual({
      enabled: false,
      isLocked: false,
      source: "default",
    });
  });

  it("uses the manual override when no environment flag is set", () => {
    expect(resolveDemoFleetMode({ override: true })).toEqual({
      enabled: true,
      isLocked: false,
      source: "manual",
    });
  });

  it("treats the environment flag as authoritative", () => {
    expect(resolveDemoFleetMode({ envFlag: "false", override: true })).toEqual({
      enabled: false,
      isLocked: true,
      source: "env",
    });
  });
});

describe("formatDemoFleetMenuTitle", () => {
  it("explains when the demo is locked by env", () => {
    expect(
      formatDemoFleetMenuTitle({
        enabled: true,
        isLocked: true,
        source: "env",
      }),
    ).toBe("Fleet demo: ON (locked by env)");
  });
});
