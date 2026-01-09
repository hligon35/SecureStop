import { useMemo } from 'react';
import { View } from 'react-native';
import { Card, RadioButton, Text } from 'react-native-paper';

import type { Role } from '@/constants/roles';
import { ROLE_LABEL, ROLES } from '@/constants/roles';

type Props = {
  role: Role;
  onChangeRole: (role: Role) => void;
  title?: string;
};

export function RoleSwitcherCard(props: Props) {
  const roles = useMemo(() => Object.values(ROLES), []);

  return (
    <Card>
      <Card.Title title={props.title ?? 'Role'} />
      <Card.Content>
        <RadioButton.Group value={props.role} onValueChange={(v) => props.onChangeRole(v as Role)}>
          <View style={{ gap: 8 }}>
            {roles.map((r) => (
              <View key={r} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <RadioButton value={r} />
                <Text>{ROLE_LABEL[r]}</Text>
              </View>
            ))}
          </View>
        </RadioButton.Group>
      </Card.Content>
    </Card>
  );
}
