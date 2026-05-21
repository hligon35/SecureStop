import { roleProfilePath, roleRootPath } from "@/constants/routes";

describe("routes", () => {
  it("returns the correct root route for each role", () => {
    expect(roleRootPath("parent")).toBe("/(parent)/(tabs)/map");
    expect(roleRootPath("driver")).toBe("/(driver)/(tabs)/map");
    expect(roleRootPath("admin")).toBe("/(admin)/(tabs)/fleet");
  });

  it("returns the correct profile route for each role", () => {
    expect(roleProfilePath("parent")).toBe("/(parent)/(tabs)/setup");
    expect(roleProfilePath("driver")).toBe("/(driver)/(tabs)/setup");
    expect(roleProfilePath("admin")).toBe("/(admin)/(tabs)/settings");
  });
});
