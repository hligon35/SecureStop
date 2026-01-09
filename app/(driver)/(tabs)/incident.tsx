import { ScrollView, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { useNotificationStore } from '@/store/notifications';
import { useTripStore } from '@/store/trip';

export default function DriverIncidentScreen() {
  const sendDriverAlert = useNotificationStore((s) => s.sendDriverAlert);
  const vehicleId = useTripStore((s) => s.vehicleId);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Content style={{ alignItems: 'center', gap: 12, paddingVertical: 20 }}>
          <Text variant="titleMedium" style={{ textAlign: 'center' }}>
            Incident Report
          </Text>
          <Text variant="bodySmall" style={{ textAlign: 'center' }}>
            Sends an urgent incident report to School/Admin.
          </Text>

          <Button
            mode="contained"
            icon="car-crash"
            contentStyle={{ height: 56, paddingHorizontal: 16 }}
            onPress={() =>
              sendDriverAlert({
                templateId: 'contact_admin',
                recipients: 'school',
                notes: ['Incident Report'],
                vehicleId,
              })
            }
          >
            Submit
          </Button>
        </Card.Content>
      </Card>

      <View />
    </ScrollView>
  );
}
