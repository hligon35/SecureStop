import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Divider, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/auth';

export function AppHeader(props: { title?: string }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const role = useAuthStore((s) => s.role);

  const title = props.title ?? 'SecureStop';

  return (
    <View style={{ backgroundColor: theme.colors.surface }}>
      <View
        style={{
          paddingTop: insets.top,
          height: insets.top + 44,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}
      >
        {role === 'admin' ? (
          <View style={{ position: 'absolute', left: 8, bottom: 0, top: insets.top, justifyContent: 'center' }}>
            <IconButton
              icon="bell-alert"
              mode="contained"
              size={18}
              containerColor={theme.colors.surfaceVariant}
              accessibilityLabel="Open alerts"
              onPress={() => {
                router.push('/(admin)/(tabs)/alerts');
              }}
            />
          </View>
        ) : null}
        <Text variant="titleMedium">{title}</Text>
      </View>
      <Divider />
    </View>
  );
}
