import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function AdminWebStudents() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Students / Riders" subtitle="Web" />
        <Card.Content>
          <Text>Link students/riders to parents, manage eligibility, stops, permissions.</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
