import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';

export function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}) {
  return <MaterialCommunityIcons size={26} style={{ marginBottom: -3 }} {...props} />;
}
