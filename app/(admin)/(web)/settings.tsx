import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function AdminWebSettings() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Settings" subtitle="Web" />
        <Card.Content>
          <Text>Branding (logo/colors), message templates, notification rules, feature toggles.</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
