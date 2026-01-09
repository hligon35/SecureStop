import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { alertVisibleToViewer, useNotificationStore } from '@/store/notifications';
import { useTripStore } from '@/store/trip';

export default function AdminWebDashboard() {
  const tripRouteId = useTripStore((s) => s.routeId);
  const tripVehicleId = useTripStore((s) => s.vehicleId);
  const tripDriverName = useTripStore((s) => s.driverName);
  const tripStatus = useTripStore((s) => s.status);

  const inbox = useNotificationStore((s) => s.inbox);
  const prefs = useNotificationStore((s) => s.prefs);

  const visibleInbox = useMemo(
    () => inbox.filter((msg) => alertVisibleToViewer({ msg, viewerRole: 'admin', prefs })),
    [inbox, prefs]
  );

  const urgentCount = useMemo(
    () => visibleInbox.filter((m) => m.severity === 'red' || m.templateId === 'emergency').length,
    [visibleInbox]
  );

  const latest = visibleInbox[0];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Content>
          <Text>Fleet overview, alerts requiring attention, and KPIs go here.</Text>
          <Text variant="labelSmall">Urgent alerts: {urgentCount}</Text>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Fleet Overview Panel" subtitle="Mock (wired to shared state)" />
        <Card.Content>
          <Text>Active vehicles: 1 (mock)</Text>
          <View style={{ marginTop: 8, gap: 2 }}>
            <Text variant="labelSmall">Vehicle: {tripVehicleId}</Text>
            <Text variant="labelSmall">Driver: {tripDriverName}</Text>
            <Text variant="labelSmall">Route: {tripRouteId}</Text>
            <Text variant="labelSmall">Status: {tripStatus}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Alerts Requiring Attention" subtitle="Wired to inbox" />
        <Card.Content>
          <Text variant="labelSmall">Visible alerts: {visibleInbox.length}</Text>
          <Text variant="labelSmall">Urgent alerts: {urgentCount}</Text>
          <View style={{ marginTop: 8, gap: 2 }}>
            <Text>Latest: {latest ? latest.title : '—'}</Text>
            {latest ? (
              <Text variant="labelSmall">
                Recipients: {latest.recipients} · Severity: {latest.severity ?? '—'} · From: {latest.createdByRole}
              </Text>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
