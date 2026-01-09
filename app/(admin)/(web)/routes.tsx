import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function AdminWebRoutes() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Content>
          <Text>Create/edit routes, add/remove stops, schedules, assignments, CSV upload.</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
