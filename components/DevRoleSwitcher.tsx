import * as Location from 'expo-location';
import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { IconButton, Menu } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Role } from '@/constants/roles';
import { ROLE_LABEL } from '@/constants/roles';
import { roleRootPath } from '@/constants/routes';
import { useAuthStore } from '@/store/auth';
import { useLocationStore } from '@/store/location';

export function DevRoleSwitcher(props: { inline?: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const role = useAuthStore((s) => s.role);
  const setRole = useAuthStore((s) => s.setRole);

  const setVehicleLocation = useLocationStore((s) => s.setVehicleLocation);
  const demoFleetOverride = useLocationStore((s) => s.demoFleetOverride);
  const setDemoFleetOverride = useLocationStore((s) => s.setDemoFleetOverride);

  const [open, setOpen] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);

  const devEnabled = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

  // Hidden on web; constant on mobile (in dev).
  if (Platform.OS === 'web') return null;
  if (!devEnabled) return null;

  // Ensure the menu never gets "stuck" across route transitions.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const goToRole = useCallback(
    (nextRole: Role) => {
      setOpen(false);
      setRole(nextRole);

      // Defer navigation until after state + menu close apply.
      requestAnimationFrame(() => {
        router.replace(roleRootPath(nextRole));
      });
    },
    [router, setRole]
  );

  const snapGpsOnce = useCallback(async () => {
    setOpen(false);
    setGpsBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') return;

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setVehicleLocation({
        coordinate: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
        updatedAt: Date.now(),
        heading: pos.coords.heading ?? undefined,
      });
    } finally {
      setGpsBusy(false);
    }
  }, [setVehicleLocation]);

  const menu = (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={
        <IconButton
          icon="account-switch"
          size={22}
          mode="contained"
          accessibilityLabel="Developer role switcher"
          onPress={() => setOpen((v) => !v)}
        />
      }
    >
      <Menu.Item
        title={gpsBusy ? 'GPS snap (busy…) ' : 'GPS snap (one-time)'}
        disabled={gpsBusy}
        onPress={snapGpsOnce}
        leadingIcon="crosshairs-gps"
      />
      <Menu.Item
        title={`Demo mode: ON${demoFleetOverride === true ? ' ✓' : ''}`}
        onPress={() => {
          setOpen(false);
          setDemoFleetOverride(true);
        }}
        leadingIcon="play-circle"
      />
      <Menu.Item
        title={`${ROLE_LABEL.parent}${role === 'parent' ? ' ✓' : ''}`}
        onPress={() => {
          goToRole('parent');
        }}
        leadingIcon="account"
      />
      <Menu.Item
        title={`${ROLE_LABEL.driver}${role === 'driver' ? ' ✓' : ''}`}
        onPress={() => {
          goToRole('driver');
        }}
        leadingIcon="steering"
      />
      <Menu.Item
        title={`${ROLE_LABEL.admin}${role === 'admin' ? ' ✓' : ''}`}
        onPress={() => {
          goToRole('admin');
        }}
        leadingIcon="shield-account"
      />
    </Menu>
  );

  if (props.inline) {
    return menu;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top,
        right: 8,
        height: 44,
        justifyContent: 'center',
        zIndex: 1000,
        elevation: 1000,
      }}
    >
      {menu}
    </View>
  );
}
