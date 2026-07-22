import { Redirect } from "expo-router";
import { Platform } from "react-native";

import { roleRootPath } from "@/constants/routes";
import { hasTenantContext } from "@/lib/tenancy/context";
import { useAuthStore } from "@/store/auth";
import { useTenantMembershipStore } from "@/store/tenantMembership";

export default function Index() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const tenantMembershipHydrated = useTenantMembershipStore((s) => s.hydrated);
  const activeTenantId = useTenantMembershipStore((s) => s.activeTenantId);

  if (!hydrated || !tenantMembershipHydrated) return null;

  if (!isAuthenticated) {
    return <Redirect href={Platform.OS === "web" ? "/marketing" : "/login"} />;
  }

  if (role === "admin" && Platform.OS === "web") {
    return <Redirect href="/(admin)/(web)/dashboard" />;
  }

  if (role === "admin") {
    return <Redirect href={roleRootPath(role)} />;
  }

  if (!hasTenantContext(activeTenantId)) {
    return <Redirect href="/select-tenant" />;
  }

  return <Redirect href={roleRootPath(role)} />;
}
