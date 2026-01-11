import { useRouter } from 'expo-router';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Image, Pressable, useWindowDimensions, View } from 'react-native';
import { Badge, Button, Card, Chip, Divider, IconButton, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';

import { useLocationStore } from '@/store/location';
import { useNotificationStore } from '@/store/notifications';

const BUS_ICON = require('../../../assets/images/sbus.png');

type VehicleIndicatorMode = 'red-pulse' | 'red' | 'blue' | 'green-pulse' | 'green' | 'inactive';

const HeadlightDot = memo(function HeadlightDot(props: { mode: VehicleIndicatorMode; size: number; color: string }) {
  const pulse = props.mode === 'red-pulse' || props.mode === 'green-pulse';
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  // Keep the core dot fully saturated (no opacity). Only the glow pulses.
  const glowSize = Math.round(props.size * 2.8);
  const glowScale = anim.interpolate({ inputRange: [0, 1], outputRange: [1.05, 1.35] });
  const glowOpacity = pulse ? 0.32 : 0;

  return (
    <View style={{ width: glowSize, height: glowSize, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: glowSize,
          height: glowSize,
          borderRadius: glowSize / 2,
          backgroundColor: props.color,
          opacity: glowOpacity,
          transform: [{ scale: pulse ? glowScale : 1 }],
          shadowColor: props.color,
          shadowOpacity: pulse ? 0.85 : 0,
          shadowRadius: 7,
          shadowOffset: { width: 0, height: 0 },
          elevation: pulse ? 8 : 0,
        }}
      />
      <View
        style={{
          width: props.size,
          height: props.size,
          borderRadius: props.size / 2,
          backgroundColor: props.color,
        }}
      />
    </View>
  );
});

const VehicleCard = memo(function VehicleCard(props: {
  id: string;
  badgeNumber: number;
  selected: boolean;
  mode: VehicleIndicatorMode;
  colors: { green: string; blue: string; red: string; inactive: string };
  cardWidth: number;
  onPress: () => void;
  busIcon: any;
}) {
  const dotSize = 10;
  const dotColor =
    props.mode === 'green' || props.mode === 'green-pulse'
      ? props.colors.green
      : props.mode === 'blue'
        ? props.colors.blue
        : props.mode === 'red' || props.mode === 'red-pulse'
          ? props.colors.red
          : props.colors.inactive;

  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={`Bus #${props.badgeNumber}`}
      style={{ width: props.cardWidth }}
    >
      <View
        style={{
          height: 92,
          borderRadius: 16,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderWidth: props.selected ? 2 : 0,
          borderColor: props.selected ? props.colors.blue : 'transparent',
        }}
      >
        <Image source={props.busIcon} style={{ width: 75, height: 75, resizeMode: 'contain' }} />

        <View
          style={{
            position: 'absolute',
            top: 8,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 2,
            elevation: 2,
          }}
        >
          <Text variant="labelSmall" style={{ color: 'black' }}>
            {props.badgeNumber}
          </Text>
        </View>

        <View style={{ position: 'absolute', top: 51, left: 14, zIndex: 2, elevation: 2 }}>
          <HeadlightDot mode={props.mode} size={dotSize} color={dotColor} />
        </View>
        <View style={{ position: 'absolute', top: 51, right: 14, zIndex: 2, elevation: 2 }}>
          <HeadlightDot mode={props.mode} size={dotSize} color={dotColor} />
        </View>
      </View>
    </Pressable>
  );
});

export default function AdminFleetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const fleet = useLocationStore((s) => s.fleet);
  const demoFleetOverride = useLocationStore((s) => s.demoFleetOverride);
  const inbox = useNotificationStore((s) => s.inbox);
  const sendAdminBroadcast = useNotificationStore((s) => s.sendAdminBroadcast);

  const greenAlertsByVehicleId = useMemo(() => {
    const map = new Map<string, number>();
    for (const msg of inbox) {
      if (!msg.vehicleId) continue;
      if ((msg.severity ?? 'green') !== 'green') continue;
      map.set(msg.vehicleId, (map.get(msg.vehicleId) ?? 0) + 1);
    }
    return map;
  }, [inbox]);
  const demoFleet = useMemo(() => {
    const flag = process.env.EXPO_PUBLIC_DEMO_FLEET;
    if (flag === 'true') return true;
    if (flag === 'false') return false;
    if (typeof demoFleetOverride === 'boolean') return demoFleetOverride;
    return !__DEV__;
  }, [demoFleetOverride]);

  const { width } = useWindowDimensions();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [fleetFilter, setFleetFilter] = useState<'all' | 'ok' | 'delay' | 'out'>('all');
  const chatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(chatAnim, {
      toValue: chatOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [chatAnim, chatOpen]);

  useEffect(() => {
    if (!detailsOpen) setChatOpen(false);
  }, [detailsOpen]);

  const messagesForSelected = useMemo(() => {
    if (!selectedVehicleId) return [];
    return inbox
      .filter((m) => m.vehicleId === selectedVehicleId)
      .slice()
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [inbox, selectedVehicleId]);

  const latestMessageForSelected = useMemo(() => messagesForSelected[0], [messagesForSelected]);

  const [replyText, setReplyText] = useState('');

  const cardWidth = 78;
  const gap = 8;
  const horizontalPadding = 12;
  const availableWidth = Math.max(1, width - horizontalPadding * 2);
  const numColumns = Math.max(2, Math.floor((availableWidth + gap) / (cardWidth + gap)));

  const redAlertsByVehicleId = useMemo(() => {
    const map = new Map<string, number>();
    for (const msg of inbox) {
      if (!msg.vehicleId) continue;
      if ((msg.severity ?? 'green') !== 'red') continue;
      map.set(msg.vehicleId, (map.get(msg.vehicleId) ?? 0) + 1);
    }
    return map;
  }, [inbox]);

  useEffect(() => {
    if (!demoFleet) return;

    let tick = 0;
    const timeouts = new Set<ReturnType<typeof setTimeout>>();

    const interval = setInterval(() => {
      const { fleet: liveFleet, setFleetVehicleOperational } = useLocationStore.getState();
      const { receiveAlert, removeAlertById } = useNotificationStore.getState();

      if (liveFleet.length === 0) return;

      const vehicle = liveFleet[tick % liveFleet.length];
      const phase = tick % 6;

      const demoAlertId = `demo-red-${vehicle.id}`;
      const demoGreenId = `demo-green-${vehicle.id}`;

      // Clear any previous demo message unless we re-add it below.
      removeAlertById(demoAlertId);
      removeAlertById(demoGreenId);

      if (phase === 0) {
        // OK (green)
        setFleetVehicleOperational(vehicle.id, { status: 'On Route', delayMinutes: 0 });
      } else if (phase === 1) {
        // Delay (blue)
        setFleetVehicleOperational(vehicle.id, { status: 'On Route', delayMinutes: 6 });
      } else if (phase === 2) {
        // Out of service (red)
        setFleetVehicleOperational(vehicle.id, { status: 'In Depot', delayMinutes: 0 });
      } else if (phase === 3) {
        // Message waiting (pulsing red)
        setFleetVehicleOperational(vehicle.id, { status: 'On Route', delayMinutes: 0 });
        receiveAlert({
          id: demoAlertId,
          title: 'Demo: Message Waiting',
          body: 'New message waiting for this bus.',
          recipients: 'school',
          severity: 'red',
          vehicleId: vehicle.id,
          createdAt: Date.now(),
          createdByRole: 'driver',
        });

        const t = setTimeout(() => {
          useNotificationStore.getState().removeAlertById(demoAlertId);
        }, 1800);
        timeouts.add(t);
      } else if (phase === 4) {
        // OK + pulse green (shining)
        setFleetVehicleOperational(vehicle.id, { status: 'On Route', delayMinutes: 0 });
        receiveAlert({
          id: demoGreenId,
          title: 'Demo: All Good',
          body: 'Status confirmed OK.',
          recipients: 'school',
          severity: 'green',
          vehicleId: vehicle.id,
          createdAt: Date.now(),
          createdByRole: 'driver',
        });

        const t = setTimeout(() => {
          useNotificationStore.getState().removeAlertById(demoGreenId);
        }, 1600);
        timeouts.add(t);
      } else {
        // Back to OK
        setFleetVehicleOperational(vehicle.id, { status: 'On Route', delayMinutes: 0 });
      }

      tick += 1;
    }, 2200);

    return () => {
      clearInterval(interval);
      timeouts.forEach((t) => clearTimeout(t));
      timeouts.clear();
    };
  }, [demoFleet]);

  function vehicleHasWaitingAlert(vehicleId: string) {
    return (redAlertsByVehicleId.get(vehicleId) ?? 0) > 0;
  }

  function vehicleHasGreenPulse(vehicleId: string) {
    return (greenAlertsByVehicleId.get(vehicleId) ?? 0) > 0;
  }

  function operationalState(v: (typeof fleet)[number]): 'ok' | 'delay' | 'out' {
    if (v.status === 'In Depot') return 'out';
    if (v.delayMinutes > 0) return 'delay';
    return 'ok';
  }

  const indicatorColors = useMemo(
    () => ({
      // Status lights should be vivid and consistent across themes.
      green: '#00ff37',
      blue: '#007bff',
      red: '#ff0000',
      inactive: 'black',
    }),
    []
  );

  const gridData = useMemo(() => {
    function badgeNumberToSortable(value: unknown): { hasNumber: boolean; number: number; alpha: string } {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return { hasNumber: true, number: value, alpha: '' };
      }
      const text = String(value ?? '').trim();
      const match = text.match(/(\d+)/);
      if (!match) return { hasNumber: false, number: Number.POSITIVE_INFINITY, alpha: text.toLowerCase() };
      const numberPart = Number(match[1]);
      return {
        hasNumber: Number.isFinite(numberPart),
        number: Number.isFinite(numberPart) ? numberPart : Number.POSITIVE_INFINITY,
        alpha: text.replace(/\d+/g, '').trim().toLowerCase(),
      };
    }

    function vehicleSortPriority(v: (typeof fleet)[number]) {
      // Requested priority: pulsing red first, then delayed, then pulsing green, then solid green.
      const hasRedPulse = vehicleHasWaitingAlert(v.id);
      if (hasRedPulse) return 0;

      const state = operationalState(v);
      if (state === 'delay') return 1;

      const recentlyMarkedOOS =
        v.status === 'In Depot' &&
        typeof (v as any).statusUpdatedAt === 'number' &&
        Date.now() - v.statusUpdatedAt <= 24 * 60 * 60 * 1000;
      if (recentlyMarkedOOS) return 2;

      const hasGreenPulse = state === 'ok' && vehicleHasGreenPulse(v.id);
      if (hasGreenPulse) return 3;

      if (state === 'ok') return 4;

      // Any remaining states (e.g. out-of-service) fall after the prioritized ones.
      return 5;
    }

    return [...fleet]
      .sort((a, b) => {
        const prA = vehicleSortPriority(a);
        const prB = vehicleSortPriority(b);
        if (prA !== prB) return prA - prB;

        const badgeA = badgeNumberToSortable((a as any).badgeNumber);
        const badgeB = badgeNumberToSortable((b as any).badgeNumber);

        if (badgeA.hasNumber && badgeB.hasNumber && badgeA.number !== badgeB.number) return badgeA.number - badgeB.number;
        if (badgeA.hasNumber !== badgeB.hasNumber) return badgeA.hasNumber ? -1 : 1;

        if (badgeA.alpha !== badgeB.alpha) return badgeA.alpha.localeCompare(badgeB.alpha);
        return String(a.id).toLowerCase().localeCompare(String(b.id).toLowerCase());
      })
      .map((v) => {
        const state = operationalState(v);
        const hasRedPulse = vehicleHasWaitingAlert(v.id);
        const hasGreenPulse = !hasRedPulse && state === 'ok' && vehicleHasGreenPulse(v.id);
        const mode: VehicleIndicatorMode = hasRedPulse
          ? 'red-pulse'
          : state === 'out'
            ? 'red'
            : state === 'delay'
              ? 'blue'
              : hasGreenPulse
                ? 'green-pulse'
                : state === 'ok'
                  ? 'green'
                  : 'inactive';

        return { id: v.id, badgeNumber: (v as any).badgeNumber, state, mode };
      });
  }, [fleet, greenAlertsByVehicleId, redAlertsByVehicleId]);

  const filteredGridData = useMemo(() => {
    if (fleetFilter === 'all') return gridData;
    return gridData.filter((v) => v.state === fleetFilter);
  }, [fleetFilter, gridData]);

  useEffect(() => {
    if (!selectedVehicleId) return;
    const stillVisible = filteredGridData.some((v) => v.id === selectedVehicleId);
    if (stillVisible) return;

    setSelectedVehicleId(undefined);
    setDetailsOpen(false);
    setChatOpen(false);
  }, [filteredGridData, selectedVehicleId]);

  const selectedVehicle = useMemo(
    () => (selectedVehicleId ? fleet.find((v) => v.id === selectedVehicleId) : undefined),
    [fleet, selectedVehicleId]
  );

  return (
    <View style={{ flex: 1, paddingTop: 6 }}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 6, alignItems: 'stretch', gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="titleSmall" style={{ textAlign: 'left' }}>
            Fleet Overview
          </Text>

          <View style={{ position: 'relative' }}>
            <IconButton
              icon="filter-variant"
              mode="contained"
              size={18}
              containerColor={theme.colors.surfaceVariant}
              accessibilityLabel="Filter fleet overview"
              style={{ margin: 0, width: 34, height: 34 }}
              onPress={() => setFilterOpen(true)}
            />
            {fleetFilter !== 'all' ? (
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
              <Text variant="titleSmall">Filter fleet</Text>
              <Button
                compact
                onPress={() => {
                  setFleetFilter('all');
                }}
              >
                Clear
              </Button>
            </View>

            <Divider />

            <View style={{ gap: 8 }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Status
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Chip selected={fleetFilter === 'all'} onPress={() => setFleetFilter('all')}>
                  All
                </Chip>
                <Chip selected={fleetFilter === 'ok'} onPress={() => setFleetFilter('ok')}>
                  OK
                </Chip>
                <Chip selected={fleetFilter === 'delay'} onPress={() => setFleetFilter('delay')}>
                  Delayed
                </Chip>
                <Chip selected={fleetFilter === 'out'} onPress={() => setFleetFilter('out')}>
                  Out
                </Chip>
              </View>
            </View>

            <Button mode="contained" onPress={() => setFilterOpen(false)}>
              Done
            </Button>
          </View>
        </Modal>
      </Portal>

      <FlatList
        data={filteredGridData}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingVertical: 16,
          gap,
          paddingBottom: detailsOpen ? (chatOpen ? 260 : 108) : 16,
        }}
        columnWrapperStyle={{ gap }}
        renderItem={({ item }) => (
          <VehicleCard
            id={item.id}
            badgeNumber={item.badgeNumber}
            selected={selectedVehicleId === item.id}
            mode={item.mode}
            colors={indicatorColors}
            cardWidth={cardWidth}
            busIcon={BUS_ICON}
            onPress={() => {
              setSelectedVehicleId(item.id);
              setDetailsOpen(true);
              setChatOpen(false);
            }}
          />
        )}
      />

      {detailsOpen && selectedVehicleId && selectedVehicle ? (
        <Animated.View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 16,
            transform: [
              {
                translateY: chatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -140] }),
              },
            ],
          }}
        >
          <Card style={{ overflow: 'visible' }}>
            <Card.Content>
              <View style={{ position: 'relative', paddingLeft: 12, paddingRight: 56, paddingBottom: 4, minHeight: 14 }}>
                {/* Floating bus icon (top-left) */}
                <View style={{ position: 'absolute', left: -32, top: -32, width: 36, height: 36, zIndex: 3, elevation: 3 }}>
                  <Image source={BUS_ICON} style={{ width: 36, height: 36, resizeMode: 'contain' }} />
                  {/* Bus number in the grill */}
                  <View style={{ position: 'absolute', left: 0, right: 0, top: 16, alignItems: 'center' }}>
                    <Text variant="labelSmall" style={{ color: 'black' }}>
                      {selectedVehicle.badgeNumber}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text variant="titleSmall">Details</Text>

                  {/* Message push button w/ red indicator */}
                  <View style={{ position: 'relative' }}>
                    <IconButton
                      icon="message-text"
                      mode="contained"
                      size={18}
                      style={{ margin: 0 }}
                      containerColor={theme.colors.surfaceVariant}
                      accessibilityLabel={chatOpen ? 'Close messages' : 'Open messages'}
                      onPress={() => setChatOpen((v) => !v)}
                    />
                    {selectedVehicleId && vehicleHasWaitingAlert(selectedVehicleId) ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.colors.error,
                        }}
                      />
                    ) : null}
                  </View>

                  <IconButton
                    icon="map-marker-path"
                    mode="contained"
                    size={18}
                    style={{ margin: 0 }}
                    containerColor={theme.colors.surfaceVariant}
                    accessibilityLabel="Open routes"
                    onPress={() => {
                      setDetailsOpen(false);
                      router.push({
                        pathname: '/(admin)/(tabs)/routes',
                        params: { vehicleId: selectedVehicle.id },
                      });
                    }}
                  />
                </View>

                {/* Floating close as a push button (top-right) */}
                <View style={{ position: 'absolute', right: -32, top: -32, zIndex: 3, elevation: 3 }}>
                  <IconButton
                    icon="close"
                    mode="contained"
                    containerColor={theme.colors.surfaceVariant}
                    accessibilityLabel="Close details"
                    onPress={() => setDetailsOpen(false)}
                  />
                </View>
              </View>

              {/* 1x3 card grid: Driver / Status / Delay */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <Card mode="outlined" style={{ flex: 1 }}>
                  <Card.Content style={{ paddingVertical: 8 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Driver
                    </Text>
                    <Text numberOfLines={1}>{selectedVehicle.driverName}</Text>
                  </Card.Content>
                </Card>

                <Card mode="outlined" style={{ flex: 1 }}>
                  <Card.Content style={{ paddingVertical: 8 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Status
                    </Text>
                    <Text numberOfLines={1}>{selectedVehicle.status}</Text>
                  </Card.Content>
                </Card>

                <Card mode="outlined" style={{ flex: 1 }}>
                  <Card.Content style={{ paddingVertical: 8 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Delay
                    </Text>
                    <Text numberOfLines={1}>
                      {selectedVehicle.delayMinutes > 0 ? `${selectedVehicle.delayMinutes} min` : 'On time'}
                    </Text>
                  </Card.Content>
                </Card>
              </View>

              {/* Chat drawer */}
              {chatOpen ? (
                <View style={{ marginTop: 10 }}>
                  <Card mode="outlined">
                    <Card.Content style={{ paddingVertical: 10 }}>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Latest message
                      </Text>
                      <Text variant="bodyMedium" style={{ marginTop: 4 }}>
                        {latestMessageForSelected
                          ? `${latestMessageForSelected.title} — ${latestMessageForSelected.body}`
                          : 'No messages for this bus yet.'}
                      </Text>
                    </Card.Content>
                  </Card>

                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        mode="outlined"
                        label="Reply"
                        value={replyText}
                        onChangeText={setReplyText}
                        multiline
                      />
                    </View>
                    <IconButton
                      icon="send"
                      mode="contained"
                      containerColor={theme.colors.surfaceVariant}
                      accessibilityLabel="Send reply"
                      onPress={async () => {
                        const body = replyText.trim();
                        if (!body) return;
                        await sendAdminBroadcast({
                          title: selectedVehicleId ? `Reply to ${selectedVehicleId}` : 'Reply',
                          body,
                          recipients: 'school',
                          vehicleId: selectedVehicleId,
                        });
                        setReplyText('');
                      }}
                    />
                  </View>
                </View>
              ) : null}
            </Card.Content>
          </Card>
        </Animated.View>
      ) : null}
    </View>
  );
}
