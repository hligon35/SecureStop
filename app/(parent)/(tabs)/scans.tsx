import { IdCard } from '@/components/IdCard';
import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function ParentScansScreen() {
  // TODO: Wire this up to real scan/roster data.
  const rider = {
    name: 'Jordan Williams',
    address: '1234 Oak St, Springfield, IL 62704',
    stopNumber: '12',
    grade: '5',
    age: '10',
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <IdCard person={rider} />

      <Card>
        <Card.Content>
          <Text>QR / NFC scan flows go here.</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
