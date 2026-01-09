import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

import { roleRootPath } from '@/constants/routes';
import { useAuthStore } from '@/store/auth';

export default function Index() {
  const role = useAuthStore((s) => s.role);

  if (role === 'admin' && Platform.OS === 'web') {
    return <Redirect href="/(admin)/(web)/dashboard" />;
  }

  return <Redirect href={roleRootPath(role)} />;
}
