import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function ParentScansScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Content>
          <Text>QR / NFC scan flows go here.</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
