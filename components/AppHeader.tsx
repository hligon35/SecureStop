import { useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { Divider, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DevRoleSwitcher } from '@/components/DevRoleSwitcher';
import { useAuthStore } from '@/store/auth';

function titleCaseFromSlug(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function getHeaderTitleFromSegments(segments: string[]) {
  if (segments.length === 0) return 'SecureStop';

  // Expo Router route groups appear as "(admin)", "(tabs)", etc.
  const last = segments[segments.length - 1];
  if (!last) return 'SecureStop';

  // Common tab names and known screens.
  const known: Record<string, string> = {
    index: 'SecureStop',
    fleet: 'Fleet',
    scans: 'Scans',
    routes: 'Routes',
    settings: 'Settings',
    alerts: 'Alerts',
    map: 'Map',
    delay: 'Delay',
    incident: 'Incident',
    setup: 'Profile',
    dashboard: 'Dashboard',
    'live-map': 'Live Map',
    'alerts-incidents': 'Alerts & Incidents',
  };

  if (known[last]) return known[last];
  return titleCaseFromSlug(last);
}

export function AppHeader(props: { title?: string }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const segments = useSegments();

  const screenTitle = props.title ?? getHeaderTitleFromSegments(segments);
  const canOpenAlerts = role === 'admin';

  return (
    <View style={{ backgroundColor: theme.colors.surface }}>
      <View style={{ paddingTop: insets.top }}>
        <View
          style={{
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
          }}
        >
          <View style={{ width: 44, alignItems: 'center', justifyContent: 'space-around', paddingTop: 24 }}>
            <IconButton
              icon="bell-alert"
              mode="contained"
              size={20}
              disabled={!canOpenAlerts}
              containerColor={theme.colors.surfaceVariant}
              accessibilityLabel={canOpenAlerts ? 'Open alerts' : 'Alerts (admin only)'}
              onPress={() => {
                if (!canOpenAlerts) return;
                router.push('/(admin)/(tabs)/alerts');
              }}
            />
          </View>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="titleMedium">SecureStop</Text>
          </View>

          <View style={{ width: 44, alignItems: 'center', justifyContent: 'space-around', paddingTop: 24 }}>
            <DevRoleSwitcher inline />
          </View>
        </View>

        <View style={{ paddingBottom: 8, paddingTop: 2, alignItems: 'center' }}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {screenTitle}
          </Text>
        </View>
      </View>
      <Divider />
    </View>
  );
}
