import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function AdminWebDrivers() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Drivers" subtitle="Web" />
        <Card.Content>
          <Text>Driver management, assignments, performance and incident history.</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
