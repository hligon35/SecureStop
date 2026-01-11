import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Avatar, Card, Text, useTheme } from 'react-native-paper';

export type IdCardPerson = {
  name: string;
  address: string;
  stopNumber: string;
  grade: string;
  age: string;
};

type Props = {
  person: IdCardPerson;
  typeLabel?: string;
  titleLabel?: string;
  expiresLabel?: string;
};

function initialsFromName(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return initials || 'U';
}

export function IdCard(props: Props) {
  const theme = useTheme();
  const typeLabel = props.typeLabel ?? 'Rider';
  const titleLabel = props.titleLabel ?? 'STUDENT PASS';
  const expiresLabel = props.expiresLabel ?? '06/30';

  const initials = initialsFromName(props.person.name);

  return (
    <Card mode="outlined" style={{ borderRadius: 16, overflow: 'hidden' }}>
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: theme.colors.primaryContainer,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outlineVariant,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons
            name={'shield-check' as any}
            size={18}
            color={theme.colors.onPrimaryContainer}
          />
          <Text variant="titleSmall" style={{ color: theme.colors.onPrimaryContainer }}>
            SecureStop
          </Text>
        </View>
        <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
          {titleLabel}
        </Text>
      </View>

      <Card.Content style={{ paddingTop: 12 }}>
        <View
          style={{
            position: 'absolute',
            right: -10,
            top: 46,
            transform: [{ rotate: '-18deg' }],
            opacity: 0.08,
          }}
        >
          <Text variant="displaySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            SECURESTOP
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ width: 108, alignItems: 'center', gap: 10 }}>
            <View
              style={{
                padding: 6,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.colors.outlineVariant,
                backgroundColor: theme.colors.surface,
              }}
            >
              <Avatar.Text
                size={72}
                label={initials}
                style={{ backgroundColor: theme.colors.primaryContainer }}
                color={theme.colors.onPrimaryContainer}
              />
            </View>

            <View
              style={{
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.outlineVariant,
                backgroundColor: theme.colors.surfaceVariant,
                alignSelf: 'stretch',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <MaterialCommunityIcons name={'stop-sign' as any} size={18} color={theme.colors.error} />
                <Text variant="titleSmall">{props.person.stopNumber}</Text>
              </View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                Stop #
              </Text>
            </View>
          </View>

          <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Name
                </Text>
                <Text variant="titleSmall" style={{ flexShrink: 1 }}>
                  {props.person.name}
                </Text>
              </View>

              <View style={{ width: 78, alignItems: 'center' }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Age
                </Text>
                <Text variant="titleSmall" style={{ textAlign: 'center' }}>
                  {props.person.age}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Grade
                </Text>
                <Text>{props.person.grade}</Text>
              </View>

              <View style={{ width: 78, alignItems: 'center' }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Type
                </Text>
                <Text>{typeLabel}</Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant, opacity: 0.7 }} />

            <View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Address
              </Text>
              <Text>{props.person.address}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                ID: SS-{props.person.stopNumber}-{initials}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Expires: {expiresLabel}
              </Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}
