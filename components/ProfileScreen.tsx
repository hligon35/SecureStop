import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Divider, IconButton, Snackbar, Switch, Text, TextInput, useTheme } from 'react-native-paper';

import { PasswordFields, validatePassword } from '@/components/PasswordFields';
import type { Role } from '@/constants/roles';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';

function displayNameForRole(params: { role: Role; userId: string }) {
  const { role, userId } = params;
  if (userId !== 'mock-user') return userId;
  if (role === 'admin') return 'Admin User';
  if (role === 'driver') return 'Driver User';
  return 'Parent User';
}

export function ProfileScreen(props: { role: Role; childrenSection?: React.ReactNode }) {
  const theme = useTheme();

  const email = useAuthStore((s) => s.email);
  const homeAddress = useAuthStore((s) => s.homeAddress);
  const passwordMock = useAuthStore((s) => s.passwordMock);
  const setAccount = useAuthStore((s) => s.setAccount);
  const userId = useAuthStore((s) => s.userId);

  const prefs = useNotificationStore((s) => s.prefs);
  const setPrefs = useNotificationStore((s) => s.setPrefs);

  const [isEditing, setIsEditing] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [snack, setSnack] = useState<string | null>(null);

  const name = useMemo(() => displayNameForRole({ role: props.role, userId }), [props.role, userId]);
  const phone = '(555) 010-2040';

  const isChangingPassword = passwordMock.trim().length > 0 || confirmPassword.trim().length > 0;
  const passwordValid = validatePassword(passwordMock).meetsAll;
  const confirmMatches = passwordMock === confirmPassword;
  const canFinishEditing = !isChangingPassword || (passwordValid && confirmMatches);

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card mode="outlined">
          <Card.Content style={{ gap: 10 }}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Profile
            </Text>

            <Divider style={{ marginTop: 4, marginBottom: 6, opacity: 0.25 }} />

            <IconButton
              icon={isEditing ? 'check' : 'pencil'}
              mode="contained"
              size={18}
              containerColor={theme.colors.surfaceVariant}
              accessibilityLabel={isEditing ? 'Done editing' : 'Edit profile'}
              style={{ position: 'absolute', right: 8, top: 8, zIndex: 2 }}
              onPress={() => {
                if (isEditing) {
                  if (!canFinishEditing) {
                    setSnack('Password must meet requirements and match confirmation.');
                    return;
                  }
                  setIsEditing(false);
                  setConfirmPassword('');
                  setSnack('Profile saved');
                  return;
                }

                setIsEditing(true);
              }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Name
              </Text>
              <Text>{name}</Text>
            </View>

            {isEditing ? (
              <>
                <TextInput
                  label="Email"
                  value={email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={isEditing}
                  onChangeText={(v) => setAccount({ email: v })}
                />

                <TextInput
                  label="Home address"
                  value={homeAddress}
                  editable={isEditing}
                  onChangeText={(v) => setAccount({ homeAddress: v })}
                />

                <PasswordFields
                  password={passwordMock}
                  confirmPassword={confirmPassword}
                  onChangePassword={(v) => setAccount({ passwordMock: v })}
                  onChangeConfirmPassword={setConfirmPassword}
                  editable={isEditing}
                  hideDivider
                />
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Email
                  </Text>
                  <Text>{email}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Home address
                  </Text>
                  <Text>{homeAddress}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Password
                  </Text>
                  <Text>{passwordMock ? '••••••••' : 'Not set'}</Text>
                </View>
              </>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Phone
              </Text>
              <Text>{phone}</Text>
            </View>

            {props.childrenSection ? <View style={{ marginTop: 8 }}>{props.childrenSection}</View> : null}
          </Card.Content>
        </Card>

        <View style={{ gap: 12 }}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Notifications
          </Text>
          <Divider style={{ marginTop: -6, marginBottom: 6, opacity: 0.25 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>Notifications enabled</Text>
            <Switch value={prefs.enabled} onValueChange={(v) => setPrefs({ enabled: v })} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>Receive driver alerts</Text>
            <Switch value={prefs.receiveDriverAlerts} onValueChange={(v) => setPrefs({ receiveDriverAlerts: v })} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>Receive admin broadcasts</Text>
            <Switch value={prefs.receiveAdminBroadcasts} onValueChange={(v) => setPrefs({ receiveAdminBroadcasts: v })} />
          </View>
        </View>
      </ScrollView>

      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2400}>
        {snack ?? ''}
      </Snackbar>
    </>
  );
}
