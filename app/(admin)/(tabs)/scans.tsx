import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function AdminScansScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Scans" subtitle="Placeholder" />
        <Card.Content>
          <Text>Admin scan/audit tools go here.</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
