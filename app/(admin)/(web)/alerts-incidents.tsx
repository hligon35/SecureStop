import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function AdminWebAlertsIncidents() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Alerts & Incidents" subtitle="Web" />
        <Card.Content>
          <Text>Realtime feed, severity filters, approve/forward driver alerts, broadcast alerts.</Text>
          <Text variant="labelSmall">Incident resolution workflow and audit trail go here.</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
