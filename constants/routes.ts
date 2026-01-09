import type { Role } from '@/constants/roles';

export function roleRootPath(role: Role): `/(parent)/(tabs)/map` | `/(driver)/(tabs)/map` | `/(admin)/(tabs)/fleet` {
  switch (role) {
    case 'parent':
      return '/(parent)/(tabs)/map';
    case 'driver':
      return '/(driver)/(tabs)/map';
    case 'admin':
      return '/(admin)/(tabs)/fleet';
  }
}
