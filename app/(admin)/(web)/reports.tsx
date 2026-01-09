import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function AdminWebReports() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Reports & Analytics" subtitle="Web" />
        <Card.Content>
          <Text>On-time performance, delay causes, route efficiency, exports (CSV/PDF).</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
