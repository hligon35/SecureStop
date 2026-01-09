import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Divider, List, Text, useTheme } from 'react-native-paper';

import { VEHICLE_CAROUSEL_BOTTOM_OFFSET, VEHICLE_CAROUSEL_HEIGHT, VehicleCarousel } from '@/components/VehicleCarousel';
import { useLocationStore } from '@/store/location';
import { TripScanEvent, useTripStore } from '@/store/trip';

function formatScanCategory(category: TripScanEvent['category']) {
  switch (category) {
    case 'public-transit-passengers':
      return 'Public transit passenger';
    case 'school-student-ids':
      return 'School student ID';
    case 'private-misc':
      return 'Private / misc';
    default:
      return category;
  }
}

function formatTimestamp(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function AdminScansScreen() {
  const theme = useTheme();
  const scans = useTripStore((s) => s.scans);
  const routeId = useTripStore((s) => s.routeId);
  const vehicleId = useTripStore((s) => s.vehicleId);
  const setVehicleId = useTripStore((s) => s.setVehicleId);
  const fleet = useLocationStore((s) => s.fleet);

  const carouselItems = useMemo(
    () => fleet.map((v) => ({ id: v.id, label: String(v.badgeNumber) })),
    [fleet]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, alignItems: 'stretch', gap: 6 }}>
        <Text variant="titleSmall" style={{ textAlign: 'left' }}>
          Trip Scans
        </Text>
        <Divider style={{ alignSelf: 'stretch' }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 4,
          paddingTop: 4,
          paddingBottom: 16 + VEHICLE_CAROUSEL_HEIGHT + VEHICLE_CAROUSEL_BOTTOM_OFFSET,
        }}
      >
        {scans.length === 0 ? (
          <View style={{ paddingHorizontal: 4, paddingVertical: 12 }}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No scans recorded on this trip.</Text>
          </View>
        ) : (
          <List.Section style={{ marginTop: 0 }}>
            {scans.map((scan) => (
              <View key={scan.id}>
                <List.Accordion
                  title={scan.scannedId}
                  description={formatTimestamp(scan.scannedAt)}
                  titleNumberOfLines={1}
                  descriptionNumberOfLines={1}
                  style={{ paddingHorizontal: 0, paddingVertical: 0 }}
                >
                  <View style={{ paddingLeft: 12, paddingRight: 10, paddingBottom: 8, gap: 4 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Category
                    </Text>
                    <Text>{formatScanCategory(scan.category)}</Text>

                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                      Driver
                    </Text>
                    <Text>{scan.driverName}</Text>

                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                      Trip
                    </Text>
                    <Text>
                      Route: {routeId} • Vehicle: {vehicleId}
                    </Text>

                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                      Stop index
                    </Text>
                    <Text>{scan.stopIndex ?? '—'}</Text>

                    {scan.note ? (
                      <>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                          Note
                        </Text>
                        <Text>{scan.note}</Text>
                      </>
                    ) : null}
                  </View>
                </List.Accordion>
                <Divider />
              </View>
            ))}
          </List.Section>
        )}
      </ScrollView>

      <VehicleCarousel
        items={carouselItems}
        activeId={vehicleId}
        onSelect={setVehicleId}
        getAccessibilityLabel={(item) => `Select bus ${item.label}`}
      />
    </View>
  );
}
