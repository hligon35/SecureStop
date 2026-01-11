import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Chip, Divider, Text, TextInput } from 'react-native-paper';

import { AlertInbox } from '@/components/AlertInbox';
import { useIncidentsStore } from '@/store/incidents';
import { alertVisibleToViewer, useNotificationStore } from '@/store/notifications';

export default function AdminWebAlertsIncidents() {
  const inbox = useNotificationStore((s) => s.inbox);
  const prefs = useNotificationStore((s) => s.prefs);
  const incidents = useIncidentsStore((s) => s.incidents);
  const addNote = useIncidentsStore((s) => s.addNote);
  const resolve = useIncidentsStore((s) => s.resolve);

  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const visibleInbox = useMemo(
    () => inbox.filter((msg) => alertVisibleToViewer({ msg, viewerRole: 'admin', prefs })),
    [inbox, prefs]
  );

  const filteredIncidents = useMemo(() => {
    if (filter === 'all') return incidents;
    return incidents.filter((i) => i.status === filter);
  }, [filter, incidents]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Alerts & Incidents" subtitle="Web" />
        <Card.Content>
          <Text>Incident queue and resolution (local demo)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            <Chip selected={filter === 'open'} onPress={() => setFilter('open')}>
              Open
            </Chip>
            <Chip selected={filter === 'resolved'} onPress={() => setFilter('resolved')}>
              Resolved
            </Chip>
            <Chip selected={filter === 'all'} onPress={() => setFilter('all')}>
              All
            </Chip>
          </View>

          <Divider style={{ marginVertical: 12, opacity: 0.25 }} />

          {filteredIncidents.length === 0 ? (
            <Text style={{ opacity: 0.7 }}>No incidents.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {filteredIncidents.slice(0, 20).map((inc) => (
                <Card key={inc.id} mode="outlined">
                  <Card.Content style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text>{inc.title}</Text>
                        <Text variant="labelSmall" style={{ opacity: 0.7 }}>
                          {inc.status.toUpperCase()} · {inc.severity.toUpperCase()} · Vehicle: {inc.vehicleId ?? '—'}
                        </Text>
                      </View>
                      <Text variant="labelSmall" style={{ opacity: 0.7 }}>
                        {new Date(inc.createdAt).toLocaleString()}
                      </Text>
                    </View>

                    <Text variant="bodySmall" style={{ opacity: 0.85 }} numberOfLines={4}>
                      {inc.description}
                    </Text>

                    <TextInput
                      label="Admin note"
                      value={notes[inc.id] ?? ''}
                      onChangeText={(v) => setNotes((s) => ({ ...s, [inc.id]: v }))}
                      multiline
                    />

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                      <Button
                        mode="outlined"
                        onPress={() => {
                          const msg = (notes[inc.id] ?? '').trim();
                          if (!msg) return;
                          addNote(inc.id, { message: msg, byRole: 'admin' });
                          setNotes((s) => ({ ...s, [inc.id]: '' }));
                        }}
                      >
                        Add note
                      </Button>
                      {inc.status === 'open' ? (
                        <Button
                          mode="contained"
                          onPress={() => {
                            const msg = (notes[inc.id] ?? '').trim();
                            resolve(inc.id, { message: msg || undefined, byRole: 'admin' });
                            setNotes((s) => ({ ...s, [inc.id]: '' }));
                          }}
                        >
                          Resolve
                        </Button>
                      ) : null}
                    </View>
                  </Card.Content>
                </Card>
              ))}
              {filteredIncidents.length > 20 ? (
                <Text variant="labelSmall" style={{ opacity: 0.7 }}>
                  Showing 20 of {filteredIncidents.length}.
                </Text>
              ) : null}
            </View>
          )}
        </Card.Content>
      </Card>

      <AlertInbox inbox={visibleInbox} viewerRole="admin" />
    </ScrollView>
  );
}
