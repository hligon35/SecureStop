import { ScrollView, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';

import type { AlertSeverity } from '@/store/notifications';
import { useNotificationStore } from '@/store/notifications';
import { useTripStore } from '@/store/trip';

export default function DriverDelayScreen() {
  const theme = useTheme();

  const sendDriverAlert = useNotificationStore((s) => s.sendDriverAlert);

  const startTrip = useTripStore((s) => s.startTrip);
  const setStatus = useTripStore((s) => s.setStatus);
  const vehicleId = useTripStore((s) => s.vehicleId);

  function severityButtonColor(sev: AlertSeverity) {
    switch (sev) {
      case 'green':
        return theme.colors.tertiary;
      case 'yellow':
        return theme.colors.secondary;
      case 'orange':
        return theme.colors.secondaryContainer;
      case 'red':
        return theme.colors.error;
    }
  }

  const alertButtons: Array<{ id: string; label: string; severity: AlertSeverity }> = [
    { id: 'departed_depot', label: 'Departed\nDepot', severity: 'green' },
    { id: 'departed_school', label: 'Departed\nSchool', severity: 'green' },
    { id: 'route_started', label: 'Route\nStarted', severity: 'green' },

    { id: 'minor_delay_traffic', label: 'Minor Delay\nTraffic', severity: 'yellow' },
    { id: 'running_early', label: 'Running\nEarly', severity: 'yellow' },
    { id: 'weather_delay', label: 'Weather\nDelay', severity: 'yellow' },

    { id: 'mechanical_issue', label: 'Mechanical\nIssue', severity: 'orange' },
    { id: 'route_change', label: 'Route\nChange', severity: 'orange' },
    { id: 'substitute_bus', label: 'Substitute\nBus', severity: 'orange' },

    { id: 'emergency', label: 'Emergency', severity: 'red' },
    { id: 'unsafe_situation', label: 'Unsafe\nSituation', severity: 'red' },
    { id: 'contact_admin', label: 'Contact\nAdmin', severity: 'red' },
  ];

  function applyStatusForAlert(templateId: string) {
    switch (templateId) {
      case 'departed_depot':
      case 'departed_school':
        setStatus('Departed');
        return;
      case 'route_started':
        startTrip();
        return;
      default:
        return;
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}>
        <Card>
          <Card.Content style={{ gap: 12 }}>
            <Text variant="titleMedium" style={{ textAlign: 'center' }}>
              Push Alerts
            </Text>

            <Text variant="labelSmall" style={{ textAlign: 'center' }}>
              All alerts go to all users.
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
              {alertButtons.map((b) => (
                <Button
                  key={b.id}
                  mode="contained"
                  buttonColor={severityButtonColor(b.severity)}
                  style={{ width: '32%' }}
                  contentStyle={{ paddingVertical: 6, paddingHorizontal: 0, height: 56 }}
                  labelStyle={{ textAlign: 'center', marginHorizontal: 0, fontSize: 12, lineHeight: 14 }}
                  onPress={() => {
                    applyStatusForAlert(b.id);
                    sendDriverAlert({ templateId: b.id, recipients: 'both', vehicleId });
                  }}
                >
                  {b.label}
                </Button>
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}
