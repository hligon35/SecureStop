import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Divider, IconButton, ProgressBar, Switch, Text, TextInput, useTheme } from 'react-native-paper';

import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';

export default function DriverSetupScreen() {
  const theme = useTheme();
  const email = useAuthStore((s) => s.email);
  const homeAddress = useAuthStore((s) => s.homeAddress);
  const passwordMock = useAuthStore((s) => s.passwordMock);
  const setAccount = useAuthStore((s) => s.setAccount);

  const [isEditing, setIsEditing] = useState(false);

  const prefs = useNotificationStore((s) => s.prefs);
  const setPrefs = useNotificationStore((s) => s.setPrefs);

  const hasMinLen = passwordMock.length >= 8;
  const hasCapital = /[A-Z]/.test(passwordMock);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordMock);
  const met = [hasMinLen, hasCapital, hasSpecial].filter(Boolean).length;
  const strength = met / 3;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card mode="outlined">
        <Card.Content style={{ gap: 12 }}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Profile
          </Text>

          <Divider style={{ marginTop: 4, marginBottom: 4, opacity: 0.25 }} />

          <View style={{ position: 'relative' }}>
            <IconButton
              icon={isEditing ? 'check' : 'pencil'}
              mode="contained"
              size={18}
              containerColor={theme.colors.surfaceVariant}
              accessibilityLabel={isEditing ? 'Done editing' : 'Edit profile'}
              style={{ position: 'absolute', right: -8, top: -8, zIndex: 2 }}
              onPress={() => setIsEditing((v) => !v)}
            />
          </View>

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

          <TextInput
            label="Password"
            value={passwordMock}
            secureTextEntry
            editable={isEditing}
            onChangeText={(v) => setAccount({ passwordMock: v })}
          />

          <View style={{ gap: 6 }}>
            <Text variant="labelSmall">Password strength</Text>
            <ProgressBar progress={strength} />
            <Text variant="labelSmall">{hasCapital ? '✓' : '•'} 1 capital letter</Text>
            <Text variant="labelSmall">{hasSpecial ? '✓' : '•'} 1 special character</Text>
            <Text variant="labelSmall">{hasMinLen ? '✓' : '•'} 8+ characters</Text>
          </View>
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
      </View>
    </ScrollView>
  );
}
