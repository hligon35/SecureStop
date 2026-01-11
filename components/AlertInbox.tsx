import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Chip, Divider, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';

import type { Role } from '@/constants/roles';
import type { AlertMessage } from '@/store/notifications';
import { useNotificationStore } from '@/store/notifications';

function recipientLabel(v: AlertMessage['recipients']) {
  if (v === 'both') return 'Parents + School';
  if (v === 'school') return 'School/Admin';
  if (v === 'parents') return 'Parents';
  if (v === 'driver') return 'Driver';
  return v;
}

export function AlertInbox(props: { inbox: AlertMessage[]; viewerRole?: Role }) {
  const theme = useTheme();
  const sendAdminBroadcast = useNotificationStore((s) => s.sendAdminBroadcast);

  const viewerRole = props.viewerRole;

  const [respondTo, setRespondTo] = useState<AlertMessage | null>(null);
  const [responseText, setResponseText] = useState('');
  const [notifyParents, setNotifyParents] = useState(false);
  const [parentRecipients, setParentRecipients] = useState<'parents' | 'both'>('parents');
  const [parentText, setParentText] = useState('');

  const canSend = useMemo(() => responseText.trim().length > 0, [responseText]);

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
    <>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ gap: 12 }}>
          {props.inbox.map((m) => {
            const showAdminRespond = viewerRole === 'admin' && m.createdByRole === 'driver';

            return (
              <Card key={m.id}>
                <Card.Title title={m.title} subtitle={new Date(m.createdAt).toLocaleTimeString()} />
                <Card.Content style={{ gap: 10 }}>
                  <Text>{m.body}</Text>
                  <View style={{ gap: 2 }}>
                    <Text variant="labelSmall">From: {m.createdByRole}</Text>
                    <Text variant="labelSmall">Severity: {m.severity ?? '—'}</Text>
                    <Text variant="labelSmall">Recipients: {recipientLabel(m.recipients)}</Text>
                  </View>

                  {showAdminRespond ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <Button
                        mode="outlined"
                        icon="reply"
                        onPress={() => {
                          setRespondTo(m);
                          setResponseText('');
                          setNotifyParents(false);
                          setParentRecipients('parents');
                          setParentText('');
                        }}
                      >
                        Respond
                      </Button>
                    </View>
                  ) : null}
                </Card.Content>
              </Card>
            );
          })}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={!!respondTo}
          onDismiss={() => setRespondTo(null)}
          contentContainerStyle={{ margin: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface }}
        >
          <View style={{ padding: 16, gap: 12 }}>
            <Text variant="titleSmall">Respond to driver</Text>
            {respondTo ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                About: {respondTo.title}
              </Text>
            ) : null}

            <Divider />

            <TextInput
              mode="outlined"
              label="Reply to driver (required)"
              value={responseText}
              onChangeText={setResponseText}
              multiline
              placeholder="Instructions / next steps"
            />

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Chip selected={notifyParents === false} onPress={() => setNotifyParents(false)}>
                  Driver only
                </Chip>
                <Chip selected={notifyParents === true} onPress={() => setNotifyParents(true)}>
                  Also notify parents
                </Chip>
              </View>

              {notifyParents ? (
                <>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <Chip selected={parentRecipients === 'parents'} onPress={() => setParentRecipients('parents')}>
                      Parents
                    </Chip>
                    <Chip selected={parentRecipients === 'both'} onPress={() => setParentRecipients('both')}>
                      Parents + School
                    </Chip>
                  </View>

                  <TextInput
                    mode="outlined"
                    label="Parent message (optional)"
                    value={parentText}
                    onChangeText={setParentText}
                    multiline
                    placeholder="Leave blank to reuse the driver reply"
                  />
                </>
              ) : null}
            </View>

            <Button
              mode="contained"
              icon="send"
              disabled={!canSend || !respondTo}
              onPress={async () => {
                if (!respondTo) return;

                const driverBody = responseText.trim();
                await sendAdminBroadcast({
                  title: `Response: ${respondTo.title}`,
                  body: driverBody,
                  recipients: 'driver',
                  vehicleId: respondTo.vehicleId,
                });

                if (notifyParents) {
                  const parentBody = (parentText.trim() || driverBody).trim();
                  await sendAdminBroadcast({
                    title: `Update: ${respondTo.title}`,
                    body: parentBody,
                    recipients: parentRecipients,
                    vehicleId: respondTo.vehicleId,
                  });
                }

                setRespondTo(null);
              }}
            >
              Send
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}
