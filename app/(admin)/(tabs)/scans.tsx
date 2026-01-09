import { ScrollView, View } from 'react-native';
import { Card, Divider, IconButton, List, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const scans = useTripStore((s) => s.scans);
  const routeId = useTripStore((s) => s.routeId);
  const vehicleId = useTripStore((s) => s.vehicleId);

  const fleet = useLocationStore((s) => s.fleet);

  // Keep in sync with admin tab bar sizing.
  const bottomPad = Math.min(insets.bottom, 14);
  const tabBarHeight = 56 + bottomPad;
  const carouselHeight = 72;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 12,
          paddingBottom: 16 + carouselHeight + tabBarHeight,
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

                          <Text
                            variant="labelSmall"
                            style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}
                          >
                            Driver
                          </Text>
                          <Text>{scan.driverName}</Text>

                          <Text
                            variant="labelSmall"
                            style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}
                          >
                            Trip
                          </Text>
                          <Text>
                            Route: {routeId} • Vehicle: {vehicleId}
                          </Text>

                          <Text
                            variant="labelSmall"
                            style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}
                          >
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

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: tabBarHeight,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Divider />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 8, gap: 8, alignItems: 'center' }}
        >
          {fleet.map((v) => {
            const selected = v.id === vehicleId;
            return (
              <View key={v.id} style={{ alignItems: 'center', width: 64 }}>
                <IconButton
                  icon="bus"
                  mode={selected ? 'contained' : 'outlined'}
                  size={22}
                  containerColor={selected ? theme.colors.primaryContainer : undefined}
                  iconColor={selected ? theme.colors.onPrimaryContainer : undefined}
                  accessibilityLabel={`Vehicle ${v.id}`}
                  onPress={() => {
                    // Display-only carousel; selection is indicated by current trip vehicle.
                  }}
                />
                <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                  {v.id}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
