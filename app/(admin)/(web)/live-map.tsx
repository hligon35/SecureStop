import { ScrollView, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { GoogleFleetMap } from '@/components/web/GoogleFleetMap';
import { useLocationStore } from '@/store/location';
import { useTripStore } from '@/store/trip';

export default function AdminWebLiveMap() {
  const vehicle = useLocationStore((s) => s.vehicleLocation);
  const tripVehicleId = useTripStore((s) => s.vehicleId);
  const tripStatus = useTripStore((s) => s.status);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Live Map" subtitle="Google Maps JS" />
        <Card.Content>
          <Text>Fleet location display uses Google Maps on web.</Text>
          <View style={{ marginTop: 8, gap: 2 }}>
            <Text variant="labelSmall">Vehicle: {tripVehicleId}</Text>
            <Text variant="labelSmall">Status: {tripStatus}</Text>
            <Text variant="labelSmall">
              Last coord: {vehicle.coordinate.latitude.toFixed(5)}, {vehicle.coordinate.longitude.toFixed(5)}
            </Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <GoogleFleetMap height={420} />
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
