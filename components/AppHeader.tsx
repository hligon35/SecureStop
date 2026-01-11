import { useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Badge, Divider, IconButton, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertInbox } from '@/components/AlertInbox';
import { DevRoleSwitcher } from '@/components/DevRoleSwitcher';
import { useAuthStore } from '@/store/auth';
import { alertVisibleToViewer, useNotificationStore } from '@/store/notifications';

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
    map: 'Dashboard',
    delay: 'Delay',
    incident: 'Report',
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

  const inbox = useNotificationStore((s) => s.inbox);
  const prefs = useNotificationStore((s) => s.prefs);

  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertsLastSeenAt, setAlertsLastSeenAt] = useState<number>(Date.now());

  const startOfTodayTs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const visibleInboxToday = useMemo(() => {
    const visible = inbox.filter((msg) => alertVisibleToViewer({ msg, viewerRole: role, prefs }));
    return visible.filter((m) => (m.createdAt ?? 0) >= startOfTodayTs);
  }, [inbox, prefs, role, startOfTodayTs]);

  useEffect(() => {
    if (alertsLastSeenAt < startOfTodayTs) setAlertsLastSeenAt(startOfTodayTs);
  }, [alertsLastSeenAt, startOfTodayTs]);

  const unreadAlertCount = useMemo(() => {
    const baseline = Math.max(alertsLastSeenAt, startOfTodayTs);
    return visibleInboxToday.filter((m) => (m.createdAt ?? 0) > baseline).length;
  }, [alertsLastSeenAt, startOfTodayTs, visibleInboxToday]);

  const appTitle = 'SecureStop';
  const screenTitle = useMemo(() => {
    if (props.title) return props.title;
    const last = segments[segments.length - 1];
    if (role === 'admin' && last === 'settings') return 'Profile';
    return getHeaderTitleFromSegments(segments);
  }, [props.title, role, segments]);

  return (
    <View style={{ backgroundColor: theme.colors.surface }}>
      {/* Top row: alerts | app title | dev */}
      <View style={{ paddingTop: insets.top }}>
        <View
          style={{
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}
        >
          <View style={{ position: 'absolute', left: 8, top: 12, bottom: 0, justifyContent: 'center' }}>
            <View style={{ position: 'relative' }}>
              <IconButton
                icon={unreadAlertCount > 0 ? 'bell-alert' : 'bell-outline'}
                mode="contained"
                size={18}
                containerColor={theme.colors.surfaceVariant}
                accessibilityLabel="Open alerts"
                style={{ margin: 0, width: 34, height: 34 }}
                onPress={() => {
                  setAlertsOpen(true);
                  const newest = visibleInboxToday[0]?.createdAt;
                  setAlertsLastSeenAt(newest ?? Date.now());
                }}
              />

              {unreadAlertCount > 0 ? (
                <Badge
                  size={18}
                  style={{ position: 'absolute', right: -2, top: -2, backgroundColor: theme.colors.error }}
                >
                  {unreadAlertCount > 9 ? '9+' : String(unreadAlertCount)}
                </Badge>
              ) : null}
            </View>
          </View>

          <Text variant="titleMedium" style={{ marginTop: 2 }}>
            {appTitle}
          </Text>

          <View
            style={{
              position: 'absolute',
              right: 8,
              top: 12,
              bottom: 0,
              justifyContent: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <DevRoleSwitcher variant="header" />

            <IconButton
              icon="account-circle"
              mode="contained"
              size={18}
              containerColor={theme.colors.surfaceVariant}
              accessibilityLabel="Open profile"
              style={{ margin: 0, width: 34, height: 34 }}
              onPress={() => {
                if (role === 'admin') router.push('/(admin)/(tabs)/settings');
                else if (role === 'parent') router.push('/(parent)/(tabs)/setup');
                else if (role === 'driver') router.push('/(driver)/(tabs)/setup');
              }}
            />
          </View>
        </View>
      </View>

      <Portal>
        <Modal
          visible={alertsOpen}
          onDismiss={() => setAlertsOpen(false)}
          contentContainerStyle={{ margin: 16, borderRadius: 12, overflow: 'hidden' }}
        >
          <AlertInbox inbox={visibleInboxToday} viewerRole={role} />
        </Modal>
      </Portal>

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
