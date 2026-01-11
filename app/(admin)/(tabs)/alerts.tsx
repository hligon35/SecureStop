import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Chip, Divider, RadioButton, Text, TextInput } from 'react-native-paper';

import { AlertInbox } from '@/components/AlertInbox';
import { useIncidentsStore } from '@/store/incidents';
import { alertVisibleToViewer, useNotificationStore, type AlertMessage, type AlertSeverity, type RecipientGroup } from '@/store/notifications';

type SeverityFilter = 'all' | AlertSeverity;

export default function AdminAlertsScreen() {
  const inbox = useNotificationStore((s) => s.inbox);
  const prefs = useNotificationStore((s) => s.prefs);
  const sendAdminBroadcast = useNotificationStore((s) => s.sendAdminBroadcast);

  const incidents = useIncidentsStore((s) => s.incidents);
  const addIncidentNote = useIncidentsStore((s) => s.addNote);
  const resolveIncident = useIncidentsStore((s) => s.resolve);

  const [filter, setFilter] = useState<SeverityFilter>('all');

  const visibleInbox = useMemo(
    () => inbox.filter((msg) => alertVisibleToViewer({ msg, viewerRole: 'admin', prefs })),
    [inbox, prefs]
  );

  const filteredInbox = useMemo(() => {
    if (filter === 'all') return visibleInbox;
    return visibleInbox.filter((m) => m.severity === filter);
  }, [filter, visibleInbox]);

  const [recipients, setRecipients] = useState<RecipientGroup>('both');
  const [title, setTitle] = useState('Broadcast');
  const [body, setBody] = useState('This is a sample admin broadcast.');

  const urgentCount = useMemo(
    () => visibleInbox.filter((m) => m.severity === 'red' || m.templateId === 'emergency').length,
    [visibleInbox]
  );

  const openIncidents = useMemo(() => incidents.filter((i) => i.status === 'open'), [incidents]);
  const [incidentNotes, setIncidentNotes] = useState<Record<string, string>>({});

  function approveForwardPlaceholder(_msg: AlertMessage) {
    // Placeholder: in a real system, this would change status + forward to recipients.
    // For scaffold: we just stage a new local broadcast.
    sendAdminBroadcast({
      title: 'Approved Alert',
      body: 'A driver alert was approved/forwarded (placeholder).',
      recipients: 'both',
    });
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Alerts & Incidents" subtitle={`Requires attention: ${urgentCount}`} />
        <Card.Content>
          <Text variant="labelSmall">Severity filter</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <Chip selected={filter === 'all'} onPress={() => setFilter('all')}>
              All
            </Chip>
            <Chip selected={filter === 'red'} onPress={() => setFilter('red')}>
              Red
            </Chip>
            <Chip selected={filter === 'orange'} onPress={() => setFilter('orange')}>
              Orange
            </Chip>
            <Chip selected={filter === 'yellow'} onPress={() => setFilter('yellow')}>
              Yellow
            </Chip>
            <Chip selected={filter === 'green'} onPress={() => setFilter('green')}>
              Green
            </Chip>
          </View>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Incident workflow" subtitle={`Open incidents: ${openIncidents.length}`} />
        <Card.Content style={{ gap: 10 }}>
          <Text variant="labelSmall">High-severity alerts (red/orange) create incidents automatically.</Text>
          <Divider style={{ opacity: 0.25 }} />

          {openIncidents.length === 0 ? (
            <Text style={{ opacity: 0.7 }}>No open incidents.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {openIncidents.slice(0, 5).map((inc) => (
                <Card key={inc.id} mode="outlined">
                  <Card.Content style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text>{inc.title}</Text>
                        <Text variant="labelSmall" style={{ opacity: 0.7 }}>
                          Severity: {inc.severity.toUpperCase()} · Vehicle: {inc.vehicleId ?? '—'}
                        </Text>
                      </View>
                      <Text variant="labelSmall" style={{ opacity: 0.7 }}>
                        {new Date(inc.createdAt).toLocaleTimeString()}
                      </Text>
                    </View>

                    <Text variant="bodySmall" style={{ opacity: 0.85 }} numberOfLines={3}>
                      {inc.description}
                    </Text>

                    <TextInput
                      label="Add note"
                        value={incidentNotes[inc.id] ?? ''}
                        onChangeText={(v) => setIncidentNotes((s) => ({ ...s, [inc.id]: v }))}
                      placeholder="What happened / next steps"
                      multiline
                    />

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                      <Button
                        mode="outlined"
                        onPress={() => {
                          const text = (incidentNotes[inc.id] ?? '').trim();
                          if (!text) return;
                          addIncidentNote(inc.id, { message: text, byRole: 'admin' });
                          setIncidentNotes((s) => ({ ...s, [inc.id]: '' }));
                        }}
                      >
                        Add note
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => {
                          const msg = (incidentNotes[inc.id] ?? '').trim();
                          resolveIncident(inc.id, { message: msg || undefined, byRole: 'admin' });
                          setIncidentNotes((s) => ({ ...s, [inc.id]: '' }));
                        }}
                      >
                        Resolve
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))}

              {openIncidents.length > 5 ? (
                <Text variant="labelSmall" style={{ opacity: 0.7 }}>
                  Showing 5 of {openIncidents.length} open incidents.
                </Text>
              ) : null}
            </View>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Broadcast" subtitle="Send a system-wide message" />
        <Card.Content>
          <View style={{ gap: 8 }}>
            <Text variant="labelLarge">Recipients</Text>
            <RadioButton.Group value={recipients} onValueChange={(v) => setRecipients(v as RecipientGroup)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <RadioButton value="parents" />
                <Text>Parents</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <RadioButton value="school" />
                <Text>School</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <RadioButton value="driver" />
                <Text>Driver</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <RadioButton value="both" />
                <Text>Both</Text>
              </View>
            </RadioButton.Group>

            <TextInput label="Title" value={title} onChangeText={setTitle} />
            <TextInput label="Message" value={body} onChangeText={setBody} multiline />

            <Button mode="contained" onPress={() => sendAdminBroadcast({ title, body, recipients })}>
              Send broadcast
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Realtime Feed" subtitle="Tap to approve/forward (placeholder)" />
        <Card.Content>
          {filteredInbox.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Button mode="outlined" onPress={() => approveForwardPlaceholder(filteredInbox[0])}>
                Approve/Forward newest alert
              </Button>
            </View>
          ) : null}
        </Card.Content>
      </Card>

      <AlertInbox inbox={filteredInbox} viewerRole="admin" />
    </ScrollView>
  );
}
