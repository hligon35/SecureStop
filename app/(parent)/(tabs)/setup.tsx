import { View } from 'react-native';
import { Avatar, Text, useTheme } from 'react-native-paper';

import { ProfileScreen } from '@/components/ProfileScreen';

export default function ParentSetupScreen() {
  const theme = useTheme();
  return (
    <ProfileScreen
      role="parent"
      childrenSection={
        <>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Children
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Avatar.Text size={36} label="A" />
            <Avatar.Text size={36} label="B" />
            <Avatar.Text size={36} label="C" />
          </View>
        </>
      }
    />
  );
}
