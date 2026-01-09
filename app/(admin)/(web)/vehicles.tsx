import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function AdminWebVehicles() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Vehicles" subtitle="Web" />
        <Card.Content>
          <Text>Vehicle registry, assignment, telemetry (optional), maintenance status.</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
