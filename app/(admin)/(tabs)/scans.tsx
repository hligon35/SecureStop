import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Divider, List, Text, useTheme } from 'react-native-paper';

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
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 12,
          paddingBottom: 16 + VEHICLE_CAROUSEL_HEIGHT + VEHICLE_CAROUSEL_BOTTOM_OFFSET,
        }}
      >
        <Card mode="outlined">
          <Card.Title title="Driver scans on trip" />
          <Card.Content>
            {scans.length === 0 ? (
              <Text style={{ color: theme.colors.onSurfaceVariant }}>No scans recorded on this trip.</Text>
            ) : (
              <View style={{ marginHorizontal: -8 }}>
                <List.Section>
                  {scans.map((scan) => (
                    <View key={scan.id}>
                      <List.Accordion
                        title={scan.scannedId}
                        description={formatTimestamp(scan.scannedAt)}
                        titleNumberOfLines={1}
                        descriptionNumberOfLines={1}
                      >
                        <View style={{ paddingLeft: 16, paddingRight: 12, paddingBottom: 10, gap: 6 }}>
                          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            Category
                          </Text>
                          <Text>{formatScanCategory(scan.category)}</Text>

                          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
                            Driver
                          </Text>
                          <Text>{scan.driverName}</Text>

                          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
                            Trip
                          </Text>
                          <Text>
                            Route: {routeId} • Vehicle: {vehicleId}
                          </Text>

                          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
                            Stop index
                          </Text>
                          <Text>{scan.stopIndex ?? '—'}</Text>

                          {scan.note ? (
                            <>
                              <Text
                                variant="labelSmall"
                                style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}
                              >
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
              </View>
            )}
          </Card.Content>
        </Card>
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
