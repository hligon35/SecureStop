import { ScrollView, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import type { AlertMessage } from '@/store/notifications';

export function AlertInbox(props: { inbox: AlertMessage[] }) {
  if (props.inbox.length === 0) {
    return (
      <Card>
        <Card.Title title="Alerts" />
        <Card.Content>
          <Text>No alerts yet.</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ gap: 12 }}>
        {props.inbox.map((m) => (
          <Card key={m.id}>
            <Card.Title title={m.title} subtitle={new Date(m.createdAt).toLocaleTimeString()} />
            <Card.Content>
              <Text>{m.body}</Text>
              <Text variant="labelSmall">From: {m.createdByRole}</Text>
              <Text variant="labelSmall">Severity: {m.severity ?? '—'}</Text>
              <Text variant="labelSmall">Recipients: {m.recipients}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
