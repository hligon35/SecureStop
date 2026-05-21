import {
    hasTenantContext,
    normalizeTenantId,
    toTenantContext,
} from "@/lib/tenancy/context";

describe("tenant context helpers", () => {
  it("normalizes tenant ids by trimming whitespace", () => {
    expect(normalizeTenantId(" district-123 ")).toBe("district-123");
    expect(normalizeTenantId(undefined)).toBe("");
  });

  it("detects whether a tenant context is present", () => {
    expect(hasTenantContext(" tenant-1 ")).toBe(true);
    expect(hasTenantContext("   ")).toBe(false);
  });

  it("builds tenant context from tenant and legacy school identifiers", () => {
    expect(
      toTenantContext({
        legacySchoolId: " legacy-school ",
        tenantId: " tenant-1 ",
      }),
    ).toEqual({
      legacySchoolId: "legacy-school",
      tenantId: "tenant-1",
    });

    expect(
      toTenantContext({
        legacySchoolId: " school-only ",
      }),
    ).toEqual({
      legacySchoolId: "school-only",
      tenantId: "school-only",
    });

    expect(toTenantContext({ tenantId: "   " })).toBeUndefined();
  });
});
