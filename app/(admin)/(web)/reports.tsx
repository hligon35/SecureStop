import { useEffect, useMemo } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';

import { useAdminRegistryStore } from '@/store/adminRegistry';
import { useAuthStore } from '@/store/auth';
import { useIncidentsStore } from '@/store/incidents';

export default function AdminWebReports() {
  const tenantId = useAuthStore((s) => s.schoolId);

  const ensureTenant = useAdminRegistryStore((s) => s.ensureTenant);
  const reg = useAdminRegistryStore((s) => s.byTenant[tenantId]);
  const incidents = useIncidentsStore((s) => s.incidents);

  useEffect(() => {
    if (!tenantId) return;
    ensureTenant(tenantId);
  }, [ensureTenant, tenantId]);

  const tenantIncidents = useMemo(() => incidents, [incidents]);
  const openIncidents = useMemo(() => tenantIncidents.filter((i) => i.status === 'open'), [tenantIncidents]);
  const resolvedIncidents = useMemo(() => tenantIncidents.filter((i) => i.status === 'resolved'), [tenantIncidents]);

  const rows = useMemo(() => {
    const vehicles = reg?.vehicles ?? [];
    const drivers = reg?.drivers ?? [];
    const routes = reg?.routes ?? [];
    const students = reg?.students ?? [];
    return {
      vehicles,
      drivers,
      routes,
      students,
    };
  }, [reg]);

  function downloadCsv() {
    if (Platform.OS !== 'web') return;
    const lines: string[] = [];
    lines.push(['tenantId', 'metric', 'value'].join(','));
    lines.push([tenantId, 'vehicles', String(rows.vehicles.length)].join(','));
    lines.push([tenantId, 'drivers', String(rows.drivers.length)].join(','));
    lines.push([tenantId, 'routes', String(rows.routes.length)].join(','));
    lines.push([tenantId, 'students', String(rows.students.length)].join(','));
    lines.push([tenantId, 'incidents_open', String(openIncidents.length)].join(','));
    lines.push([tenantId, 'incidents_resolved', String(resolvedIncidents.length)].join(','));

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securestop-report-${tenantId}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Reports & Analytics" subtitle="Web" />
        <Card.Content>
          <Text variant="labelSmall" style={{ opacity: 0.7 }}>
            Tenant: {tenantId || '—'}
          </Text>
          <Divider style={{ marginVertical: 10, opacity: 0.25 }} />

          <View style={{ gap: 4 }}>
            <Text variant="labelLarge">Snapshot</Text>
            <Text>Vehicles: {rows.vehicles.length}</Text>
            <Text>Drivers: {rows.drivers.length}</Text>
            <Text>Routes: {rows.routes.length}</Text>
            <Text>Students: {rows.students.length}</Text>
            <Text>Incidents: {openIncidents.length} open · {resolvedIncidents.length} resolved</Text>
          </View>

          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Button mode="contained" onPress={downloadCsv} disabled={Platform.OS !== 'web' || !tenantId}>
              Export CSV
            </Button>
          </View>

          <Text variant="labelSmall" style={{ opacity: 0.7, marginTop: 10 }}>
            Note: this is a local demo report until backend analytics are connected.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
