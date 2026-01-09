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

  const appTitle = 'SecureStop';
  const screenTitle = props.title ?? getHeaderTitleFromSegments(segments);

  return (
    <View style={{ backgroundColor: theme.colors.surface }}>
      {/* Top row: alerts | app title | dev */}
      <View style={{ paddingTop: insets.top }}>
        <View
          style={{
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}
        >
          {role === 'admin' ? (
            <View style={{ position: 'absolute', left: 8, top: 16, bottom: 0, justifyContent: 'center' }}>
              <IconButton
                icon="bell-alert"
                mode="contained"
                size={18}
                containerColor={theme.colors.surfaceVariant}
                accessibilityLabel="Open alerts"
                style={{ margin: 0, width: 34, height: 34 }}
                onPress={() => {
                  router.push('/(admin)/(tabs)/alerts');
                }}
              />
            </View>
          ) : null}

        <Text variant="titleMedium" style={{ marginTop: 2 }}>
          {appTitle}
        </Text>

          <View style={{ position: 'absolute', right: 8, top: 16, bottom: 0, justifyContent: 'center' }}>
            <DevRoleSwitcher variant="header" />
          </View>
        </View>
      </View>

      {/* Second row: screen title */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 2, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          {screenTitle}
        </Text>
      </View>

      <Divider />
    </View>
  );
}
