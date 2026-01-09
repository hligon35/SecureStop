import { Platform } from 'react-native';
import { Card, Text } from 'react-native-paper';

export type VehicleIconType = 'school_bus' | 'transit_bus' | 'box_truck' | 'semi_truck' | 'limo';

export function GoogleFleetMap(_props: { height?: number; vehicleType?: VehicleIconType }) {
  if (Platform.OS === 'web') {
    // On web, the platform-specific implementation is in GoogleFleetMap.web.tsx
    return null;
  }

  return (
    <Card>
      <Card.Title title="Live Map" subtitle="Web-only" />
      <Card.Content>
        <Text>This map is available on web only.</Text>
      </Card.Content>
    </Card>
  );
}
