import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Button, Card, Divider, RadioButton, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';

import { getConfig } from '@/lib/config';
import { useAuthStore } from '@/store/auth';

export default function SelectTenantScreen() {
  const theme = useTheme();
  const cfg = getConfig();

  const schoolId = useAuthStore((s) => s.schoolId);
  const setSchoolId = useAuthStore((s) => s.setSchoolId);

  const [mode, setMode] = useState<'list' | 'custom'>(cfg.tenants.length > 1 ? 'list' : 'custom');
  const [customId, setCustomId] = useState('');
  const [snack, setSnack] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    if (mode === 'list') return schoolId.trim().length > 0;
    return customId.trim().length > 0;
  }, [customId, mode, schoolId]);

  function continueNext() {
    if (mode === 'custom') {
      const next = customId.trim();
      if (!next) {
        setSnack('Enter a school/tenant id');
        return;
      }
      setSchoolId(next);
    }
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          padding: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 520 }}>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Text variant="headlineSmall">Choose organization</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              Select the school/agency for this session.
            </Text>
          </View>

          <Card mode="outlined" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <Card.Content style={{ gap: 12, paddingTop: 16 }}>
              {cfg.tenants.length > 1 ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button mode={mode === 'list' ? 'contained' : 'outlined'} onPress={() => setMode('list')} style={{ flex: 1 }}>
                    Pick from list
                  </Button>
                  <Button
                    mode={mode === 'custom' ? 'contained' : 'outlined'}
                    onPress={() => setMode('custom')}
                    style={{ flex: 1 }}
                  >
                    Enter code
                  </Button>
                </View>
              ) : null}

              {mode === 'list' ? (
                <>
                  <Text variant="labelLarge">Organizations</Text>
                  <RadioButton.Group value={schoolId} onValueChange={(v) => setSchoolId(String(v))}>
                    <View style={{ gap: 6 }}>
                      {cfg.tenants.map((t) => (
                        <Card key={t.id} mode="outlined">
                          <Card.Content style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <RadioButton value={t.id} />
                            <View style={{ flex: 1 }}>
                              <Text>{t.name}</Text>
                              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                {t.id}
                              </Text>
                            </View>
                          </Card.Content>
                        </Card>
                      ))}
                    </View>
                  </RadioButton.Group>
                </>
              ) : (
                <>
                  <Text variant="labelLarge">Tenant code</Text>
                  <TextInput
                    mode="outlined"
                    label="School / tenant id"
                    value={customId}
                    onChangeText={setCustomId}
                    autoCapitalize="none"
                    placeholder="e.g. district-123"
                  />
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Your administrator can provide this code.
                  </Text>
                </>
              )}

              <Divider />
              <Button mode="contained" onPress={continueNext} disabled={!canContinue} contentStyle={{ height: 50 }}>
                Continue
              </Button>
            </Card.Content>
          </Card>

          <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2400}>
            {snack ?? ''}
          </Snackbar>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
