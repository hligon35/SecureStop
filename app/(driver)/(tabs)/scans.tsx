import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function DriverScansScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Scans" subtitle="Placeholder" />
        <Card.Content>
          <Text>Driver scan workflows go here (vehicle check-in, stop validation, etc).</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
