export const TENANT_HEADER = "X-Tenant-Id";
export const LEGACY_SCHOOL_HEADER = "X-School-Id";

export type TenantContext = {
  tenantId: string;
  legacySchoolId?: string;
};

export function normalizeTenantId(value?: string | null): string {
  return (value ?? "").trim();
}

export function hasTenantContext(value?: string | null): boolean {
  return normalizeTenantId(value).length > 0;
}

export function toTenantContext(params: {
  tenantId?: string | null;
  legacySchoolId?: string | null;
}): TenantContext | undefined {
  const normalizedTenantId = normalizeTenantId(
    params.tenantId ?? params.legacySchoolId,
  );
  if (!normalizedTenantId) return undefined;

  const normalizedLegacySchoolId = normalizeTenantId(params.legacySchoolId);

  return {
    tenantId: normalizedTenantId,
    legacySchoolId: normalizedLegacySchoolId || undefined,
  };
}
