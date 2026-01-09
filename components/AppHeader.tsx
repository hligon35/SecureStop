import { View } from 'react-native';
import { Divider, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AppHeader(props: { title?: string }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

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
        <Text variant="titleMedium">{title}</Text>
      </View>
      <Divider />
    </View>
  );
}
