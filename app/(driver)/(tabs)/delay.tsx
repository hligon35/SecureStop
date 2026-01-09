import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AlertSeverity, RecipientGroup } from '@/store/notifications';
import { useNotificationStore } from '@/store/notifications';
import { useTripStore } from '@/store/trip';

export default function DriverDelayScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const recipients = useNotificationStore((s) => s.driverRecipientSelection);
  const setRecipients = useNotificationStore((s) => s.setDriverRecipientSelection);
  const sendDriverAlert = useNotificationStore((s) => s.sendDriverAlert);

  const status = useTripStore((s) => s.status);
  const startTrip = useTripStore((s) => s.startTrip);
  const pauseTrip = useTripStore((s) => s.pauseTrip);
  const endTrip = useTripStore((s) => s.endTrip);
  const setStatus = useTripStore((s) => s.setStatus);
  const vehicleId = useTripStore((s) => s.vehicleId);

  const [quickNotes, setQuickNotes] = useState<string[]>([]);

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

  const recipientButtons: Array<{ value: RecipientGroup; label: string }> = [
    { value: 'school', label: 'School\nAdmin' },
    { value: 'parents', label: 'Parents\nRiders' },
    { value: 'both', label: 'Both\nGroups' },
  ];

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

  const quickNoteButtons = useMemo(() => ['Road\nClosed', 'Accident\nNearby', 'Student\nIssue'], []);

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
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}>
        <Card>
          <Card.Content style={{ gap: 12 }}>
            <Text variant="titleMedium" style={{ textAlign: 'center' }}>
              Recipients
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
              {recipientButtons.map((b) => {
                const selected = recipients === b.value;
                return (
                  <Button
                    key={b.value}
                    mode={selected ? 'contained' : 'outlined'}
                    style={{ width: '32%' }}
                    contentStyle={{ paddingVertical: 6, paddingHorizontal: 0, height: 52 }}
                    labelStyle={{ textAlign: 'center', marginHorizontal: 0, fontSize: 12, lineHeight: 14 }}
                    onPress={() => setRecipients(b.value)}
                  >
                    {b.label}
                  </Button>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ gap: 12 }}>
            <Text variant="titleMedium" style={{ textAlign: 'center' }}>
              Push Alerts
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
                    sendDriverAlert({ templateId: b.id, recipients, notes: quickNotes, vehicleId });
                  }}
                >
                  {b.label}
                </Button>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ gap: 12 }}>
            <Text variant="titleMedium" style={{ textAlign: 'center' }}>
              Quick Notes
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
              {quickNoteButtons.map((label) => {
                const key = label.replace(/\n/g, ' ');
                const selected = quickNotes.includes(key);
                return (
                  <Button
                    key={key}
                    mode={selected ? 'contained-tonal' : 'outlined'}
                    style={{ width: '32%' }}
                    contentStyle={{ paddingVertical: 6, paddingHorizontal: 0, height: 52 }}
                    labelStyle={{ textAlign: 'center', marginHorizontal: 0, fontSize: 12, lineHeight: 14 }}
                    onPress={() =>
                      setQuickNotes((prev) =>
                        prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
                      )
                    }
                  >
                    {label}
                  </Button>
                );
              })}
            </View>
            <Text variant="labelSmall">Selected notes will be appended to alerts.</Text>
          </Card.Content>
        </Card>
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: 12,
          bottom: Math.max(12, insets.bottom + 12),
          gap: 10,
        }}
      >
        <IconButton
          icon="play"
          mode="contained"
          accessibilityLabel="Start trip"
          disabled={status === 'On Route' || status === 'Completed'}
          onPress={startTrip}
        />
        <IconButton
          icon="pause"
          mode="contained"
          accessibilityLabel="Pause trip"
          disabled={status === 'Completed'}
          onPress={pauseTrip}
        />
        <IconButton
          icon="stop"
          mode="contained"
          accessibilityLabel="End trip"
          disabled={status === 'Completed'}
          onPress={endTrip}
        />
      </View>
    </View>
  );
}
