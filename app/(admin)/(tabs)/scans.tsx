import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Badge,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { VEHICLE_CAROUSEL_BOTTOM_OFFSET, VEHICLE_CAROUSEL_HEIGHT, VehicleCarousel } from '@/components/VehicleCarousel';
import { useLocationStore } from '@/store/location';
import type { TimeOfDayBucket } from '@/store/scansFilter';
import { useScansFilterStore } from '@/store/scansFilter';
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

function matchesTimeBucket(hour: number, bucket: TimeOfDayBucket) {
  switch (bucket) {
    case 'morning':
      return hour >= 6 && hour <= 9;
    case 'midday':
      return hour >= 10 && hour <= 13;
    case 'afternoon':
      return hour >= 14 && hour <= 17;
    case 'evening':
      return hour >= 18 && hour <= 21;
    case 'overnight':
      return hour >= 22 || hour <= 5;
    case 'all':
    default:
      return true;
  }
}

export default function AdminScansScreen() {
  const theme = useTheme();
  const [filterOpen, setFilterOpen] = useState(false);

  const scans = useTripStore((s) => s.scans);
  const routeId = useTripStore((s) => s.routeId);
  const vehicleId = useTripStore((s) => s.vehicleId);
  const setVehicleId = useTripStore((s) => s.setVehicleId);
  const fleet = useLocationStore((s) => s.fleet);

  const year = useScansFilterStore((s) => s.year);
  const month = useScansFilterStore((s) => s.month);
  const day = useScansFilterStore((s) => s.day);
  const timeOfDay = useScansFilterStore((s) => s.timeOfDay);
  const setFilters = useScansFilterStore((s) => s.setFilters);
  const resetFilters = useScansFilterStore((s) => s.reset);

  const filterActive = year !== null || month !== null || day !== null || timeOfDay !== 'all';

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2];
  }, []);

  const monthOptions = useMemo(
    () => [
      { value: 1, label: 'Jan' },
      { value: 2, label: 'Feb' },
      { value: 3, label: 'Mar' },
      { value: 4, label: 'Apr' },
      { value: 5, label: 'May' },
      { value: 6, label: 'Jun' },
      { value: 7, label: 'Jul' },
      { value: 8, label: 'Aug' },
      { value: 9, label: 'Sep' },
      { value: 10, label: 'Oct' },
      { value: 11, label: 'Nov' },
      { value: 12, label: 'Dec' },
    ],
    []
  );

  const filteredScans = useMemo(() => {
    const items = scans
      .filter((scan) => {
        const d = new Date(scan.scannedAt);
        const scanYear = d.getFullYear();
        const scanMonth = d.getMonth() + 1;
        const scanDay = d.getDate();
        const scanHour = d.getHours();

        if (year !== null && scanYear !== year) return false;
        if (month !== null && scanMonth !== month) return false;
        if (day !== null && scanDay !== day) return false;
        if (!matchesTimeBucket(scanHour, timeOfDay)) return false;
        return true;
      })
      .sort((a, b) => b.scannedAt - a.scannedAt);

    return items;
  }, [day, month, scans, timeOfDay, year]);

  const carouselItems = useMemo(
    () => fleet.map((v) => ({ id: v.id, label: String(v.badgeNumber) })),
    [fleet]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, alignItems: 'stretch', gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="titleSmall" style={{ textAlign: 'left' }}>
            Trip Scans
          </Text>

          <View style={{ position: 'relative' }}>
            <IconButton
              icon="filter-variant"
              mode="contained"
              size={18}
              containerColor={theme.colors.surfaceVariant}
              accessibilityLabel="Filter trip scans"
              style={{ margin: 0, width: 34, height: 34 }}
              onPress={() => setFilterOpen(true)}
            />
            {filterActive ? (
              <Badge size={10} style={{ position: 'absolute', right: 2, top: 2, backgroundColor: theme.colors.primary }} />
            ) : null}
          </View>
        </View>
        <Divider style={{ alignSelf: 'stretch' }} />
      </View>

      <Portal>
        <Modal
          visible={filterOpen}
          onDismiss={() => setFilterOpen(false)}
          contentContainerStyle={{ margin: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface }}
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="titleSmall">Filter scans</Text>
              <Button compact onPress={() => resetFilters()}>
                Clear
              </Button>
            </View>

            <Divider />

            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
              <View style={{ gap: 8 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Year
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Chip selected={year === null} onPress={() => setFilters({ year: null })}>
                    All
                  </Chip>
                  {yearOptions.map((y) => (
                    <Chip key={y} selected={year === y} onPress={() => setFilters({ year: y })}>
                      {String(y)}
                    </Chip>
                  ))}
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Month
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Chip selected={month === null} onPress={() => setFilters({ month: null })}>
                    All
                  </Chip>
                  {monthOptions.map((m) => (
                    <Chip key={m.value} selected={month === m.value} onPress={() => setFilters({ month: m.value })}>
                      {m.label}
                    </Chip>
                  ))}
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Day (1–31)
                </Text>
                <TextInput
                  mode="outlined"
                  dense
                  keyboardType="number-pad"
                  placeholder="All"
                  value={day ? String(day) : ''}
                  onChangeText={(t) => {
                    const trimmed = t.trim();
                    if (!trimmed) {
                      setFilters({ day: null });
                      return;
                    }
                    const n = Number.parseInt(trimmed, 10);
                    if (Number.isFinite(n) && n >= 1 && n <= 31) setFilters({ day: n });
                  }}
                />
              </View>

              <View style={{ gap: 8 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Time of day
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Chip selected={timeOfDay === 'all'} onPress={() => setFilters({ timeOfDay: 'all' })}>
                    All
                  </Chip>
                  <Chip selected={timeOfDay === 'morning'} onPress={() => setFilters({ timeOfDay: 'morning' })}>
                    6:00–9:59
                  </Chip>
                  <Chip selected={timeOfDay === 'midday'} onPress={() => setFilters({ timeOfDay: 'midday' })}>
                    10:00–13:59
                  </Chip>
                  <Chip selected={timeOfDay === 'afternoon'} onPress={() => setFilters({ timeOfDay: 'afternoon' })}>
                    14:00–17:59
                  </Chip>
                  <Chip selected={timeOfDay === 'evening'} onPress={() => setFilters({ timeOfDay: 'evening' })}>
                    18:00–21:59
                  </Chip>
                  <Chip selected={timeOfDay === 'overnight'} onPress={() => setFilters({ timeOfDay: 'overnight' })}>
                    22:00–5:59
                  </Chip>
                </View>
              </View>
            </ScrollView>

            <Button mode="contained" onPress={() => setFilterOpen(false)}>
              Done
            </Button>
          </View>
        </Modal>
      </Portal>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 4,
          paddingTop: 4,
          paddingBottom: 16 + VEHICLE_CAROUSEL_HEIGHT + VEHICLE_CAROUSEL_BOTTOM_OFFSET,
        }}
      >
        {filteredScans.length === 0 ? (
          <View style={{ paddingHorizontal: 4, paddingVertical: 12 }}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {filterActive ? 'No scans match your current filters.' : 'No scans recorded on this trip.'}
            </Text>
          </View>
        ) : (
          <List.Section style={{ marginTop: 0 }}>
            {filteredScans.map((scan) => (
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
