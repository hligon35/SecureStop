import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function AdminRoutesScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Routes" subtitle="Mobile (simplified)" />
        <Card.Content>
          <Text>Route summaries go here (assigned vehicles, schedules, stop counts).</Text>
          <Text variant="labelSmall">Create/edit routes is targeted for the web dashboard.</Text>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Bulk Updates" subtitle="Placeholder" />
        <Card.Content>
          <Text>CSV upload and bulk edits are scaffolded for the web version.</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
