import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';

import { getConfig } from '@/lib/config';
import { useAdminRegistryStore } from '@/store/adminRegistry';
import { useAuthStore } from '@/store/auth';
import { useIncidentsStore } from '@/store/incidents';

export default function AdminWebSettings() {
  const cfg = getConfig();
  const tenantId = useAuthStore((s) => s.schoolId);
  const signOut = useAuthStore((s) => s.signOut);

  const ensureTenant = useAdminRegistryStore((s) => s.ensureTenant);
  const resetTenant = useAdminRegistryStore((s) => s.resetTenant);
  const clearIncidents = useIncidentsStore((s) => s.clearAll);

  useEffect(() => {
    if (!tenantId) return;
    ensureTenant(tenantId);
  }, [ensureTenant, tenantId]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Content>
          <Text variant="titleMedium">Settings</Text>
          <Text variant="labelSmall" style={{ opacity: 0.7, marginTop: 4 }}>
            Tenant: {tenantId || '—'}
          </Text>

          <Divider style={{ marginVertical: 12, opacity: 0.25 }} />

          <Text variant="labelLarge">Runtime configuration</Text>
          <View style={{ gap: 2, marginTop: 6 }}>
            <Text variant="labelSmall">API base URL: {cfg.apiBaseUrl}</Text>
            <Text variant="labelSmall">Tenants configured: {cfg.tenants.length}</Text>
            <Text variant="labelSmall">Driver GPS enabled: {cfg.features.enableDriverGps ? 'Yes' : 'No'}</Text>
            <Text variant="labelSmall">
              Push registration enabled: {cfg.features.enablePushTokenRegistration ? 'Yes' : 'No'}
            </Text>
          </View>

          <Divider style={{ marginVertical: 12, opacity: 0.25 }} />

          <Text variant="labelLarge">Maintenance</Text>
          <View style={{ gap: 8, marginTop: 8 }}>
            <Button
              mode="outlined"
              onPress={() => {
                if (!tenantId) return;
                resetTenant(tenantId);
              }}
              disabled={!tenantId}
            >
              Reset tenant registry (demo)
            </Button>
            <Button mode="outlined" onPress={() => clearIncidents()}>
              Clear incidents
            </Button>
            <Button mode="contained" onPress={() => signOut()}>
              Sign out
            </Button>
          </View>

          <Text variant="labelSmall" style={{ opacity: 0.7, marginTop: 10 }}>
            Most settings are driven by EXPO_PUBLIC_* environment variables in this scaffold.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
