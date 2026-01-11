import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

import { roleRootPath } from '@/constants/routes';
import { useAuthStore } from '@/store/auth';

export default function Index() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const schoolId = useAuthStore((s) => s.schoolId);

  if (!hydrated) return null;

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!schoolId || schoolId.trim().length === 0) {
    return <Redirect href="/select-tenant" />;
  }

  if (role === 'admin' && Platform.OS === 'web') {
    return <Redirect href="/(admin)/(web)/dashboard" />;
  }

  return <Redirect href={roleRootPath(role)} />;
}
