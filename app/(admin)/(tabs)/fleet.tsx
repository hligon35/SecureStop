import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Image, Pressable, useWindowDimensions, View } from 'react-native';
import { Card, Divider, IconButton, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';

import { useLocationStore } from '@/store/location';
import { useNotificationStore } from '@/store/notifications';

const BUS_ICON = require('../../../assets/images/sbus.png');

export default function AdminFleetScreen() {
  const theme = useTheme();
  const fleet = useLocationStore((s) => s.fleet);
  const inbox = useNotificationStore((s) => s.inbox);
  const sendAdminBroadcast = useNotificationStore((s) => s.sendAdminBroadcast);

  const demoFleet = useMemo(() => {
    const flag = process.env.EXPO_PUBLIC_DEMO_FLEET;
    if (flag === 'true') return true;
    if (flag === 'false') return false;
    return !__DEV__;
  }, []);

  const { width } = useWindowDimensions();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const latestMessageForSelected = useMemo(() => {
    if (!selectedVehicleId) return undefined;
    return inbox.find((m) => m.vehicleId === selectedVehicleId) ?? inbox[0];
  }, [inbox, selectedVehicleId]);

  const [messageOpen, setMessageOpen] = useState(false);
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
      const phase = tick % 5;

      const demoAlertId = `demo-red-${vehicle.id}`;

      // Clear any previous demo message unless we re-add it below.
      removeAlertById(demoAlertId);

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

  function operationalState(v: (typeof fleet)[number]): 'ok' | 'delay' | 'out' {
    if (v.status === 'In Depot') return 'out';
    if (v.delayMinutes > 0) return 'delay';
    return 'ok';
  }

  function PulsingDot(props: { active: boolean; size?: number }) {
    const size = props.size ?? 8;
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (!props.active) {
        anim.stopAnimation();
        anim.setValue(0);
        return;
      }

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, [anim, props.active]);

    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
    const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });

    return (
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.error,
          opacity,
          transform: [{ scale }],
        }}
      />
    );
  }

  function VehicleCard(props: { id: string; badgeNumber: number; state: 'ok' | 'delay' | 'out' }) {
    const selected = selectedVehicleId === props.id;

    const showPulsingRed = vehicleHasWaitingAlert(props.id);
    const mode: 'red-pulse' | 'red' | 'blue' | 'green' | 'inactive' = showPulsingRed
      ? 'red-pulse'
      : props.state === 'out'
        ? 'red'
        : props.state === 'delay'
          ? 'blue'
          : props.state === 'ok'
            ? 'green'
            : 'inactive';

    const dotSize = 9;
    const greenColor = theme.colors.tertiary;
    const blueColor = theme.colors.primary;
    const redColor = theme.colors.error;

    const inactiveColor = 'black';
    const inactiveOpacity = 1;

    const dotColor =
      mode === 'green'
        ? greenColor
        : mode === 'blue'
          ? blueColor
          : mode === 'red' || mode === 'red-pulse'
            ? redColor
            : inactiveColor;
    const dotIsPulsing = mode === 'red-pulse';
    const dotOpacity = mode === 'inactive' ? inactiveOpacity : 1;

    return (
      <Pressable
        onPress={() => {
          setSelectedVehicleId(props.id);
          if (showPulsingRed) {
            setDetailsOpen(false);
            setMessageOpen(true);
          } else {
            setMessageOpen(false);
            setDetailsOpen(true);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={`Bus #${props.badgeNumber}`}
        style={{
          width: cardWidth,
        }}
      >
        <View
          style={{
            height: 92,
            borderRadius: 16,
            backgroundColor: 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            borderWidth: selected ? 2 : 0,
            borderColor: selected ? theme.colors.primary : 'transparent',
          }}
        >
          {/* Larger bus icon */}
          <Image source={BUS_ICON} style={{ width: 75, height: 75, resizeMode: 'contain' }} />

          {/* Number on bus roof */}
          <View style={{ position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center', zIndex: 2, elevation: 2 }}>
            <Text variant="labelSmall" style={{ color: 'black' }}>
              {props.badgeNumber}
            </Text>
          </View>

          {/* Headlights indicators (green/blue/red) */}
          <View style={{ position: 'absolute', top: 54, left: 18, zIndex: 2, elevation: 2 }}>
            {dotIsPulsing ? (
              <PulsingDot active size={dotSize} />
            ) : (
              <View
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: dotColor,
                  opacity: dotOpacity,
                }}
              />
            )}
          </View>
          <View style={{ position: 'absolute', top: 54, right: 18, zIndex: 2, elevation: 2 }}>
            {dotIsPulsing ? (
              <PulsingDot active size={dotSize} />
            ) : (
              <View
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: dotColor,
                  opacity: dotOpacity,
                }}
              />
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  const gridData = useMemo(
    () => fleet.map((v) => ({ id: v.id, badgeNumber: v.badgeNumber, state: operationalState(v) })),
    [fleet]
  );

  const selectedVehicle = useMemo(
    () => (selectedVehicleId ? fleet.find((v) => v.id === selectedVehicleId) : undefined),
    [fleet, selectedVehicleId]
  );

  return (
    <View style={{ flex: 1, paddingTop: 16 }}>
      <View style={{ paddingHorizontal: 16, alignItems: 'center', gap: 8 }}>
        <Text variant="titleSmall" style={{ textAlign: 'center' }}>
          Fleet Overview
        </Text>
        <Divider style={{ alignSelf: 'stretch' }} />
      </View>

      <FlatList
        data={gridData}
        key={numColumns}
        numColumns={numColumns}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingVertical: 16, gap, paddingBottom: detailsOpen ? 140 : 16 }}
        columnWrapperStyle={{ gap }}
        renderItem={({ item }) => (
          <VehicleCard id={item.id} badgeNumber={item.badgeNumber} state={item.state} />
        )}
      />

      {detailsOpen && selectedVehicleId && !vehicleHasWaitingAlert(selectedVehicleId) && selectedVehicle ? (
        <View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 16,
          }}
        >
          <Card style={{ overflow: 'visible' }}>
            <Card.Content>
              <View style={{ position: 'relative', paddingLeft: 56, paddingRight: 56, paddingTop: 8, minHeight: 44 }}>
                {/* Floating bus icon (top-left) */}
                <View style={{ position: 'absolute', left: -6, top: -10, width: 52, height: 52, zIndex: 3, elevation: 3 }}>
                  <Image source={BUS_ICON} style={{ width: 52, height: 52, resizeMode: 'contain' }} />
                  {/* Bus number in the grill */}
                  <View style={{ position: 'absolute', left: 0, right: 0, top: 28, alignItems: 'center' }}>
                    <Text variant="labelSmall" style={{ color: 'black' }}>
                      {selectedVehicle.badgeNumber}
                    </Text>
                  </View>
                </View>

                <Text variant="titleSmall">Details</Text>

                {/* Floating close as a push button (top-right) */}
                <View style={{ position: 'absolute', right: -6, top: -6, zIndex: 3, elevation: 3 }}>
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
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Card mode="outlined" style={{ flex: 1 }}>
                  <Card.Content style={{ paddingVertical: 10 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Driver
                    </Text>
                    <Text numberOfLines={1}>{selectedVehicle.driverName}</Text>
                  </Card.Content>
                </Card>

                <Card mode="outlined" style={{ flex: 1 }}>
                  <Card.Content style={{ paddingVertical: 10 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Status
                    </Text>
                    <Text numberOfLines={1}>{selectedVehicle.status}</Text>
                  </Card.Content>
                </Card>

                <Card mode="outlined" style={{ flex: 1 }}>
                  <Card.Content style={{ paddingVertical: 10 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Delay
                    </Text>
                    <Text numberOfLines={1}>
                      {selectedVehicle.delayMinutes > 0 ? `${selectedVehicle.delayMinutes} min` : 'On time'}
                    </Text>
                  </Card.Content>
                </Card>
              </View>
            </Card.Content>
          </Card>
        </View>
      ) : null}

      <Portal>
        <Modal
          visible={messageOpen}
          onDismiss={() => {
            setMessageOpen(false);
            setReplyText('');
          }}
          contentContainerStyle={{
            marginHorizontal: 16,
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Text variant="titleMedium">Message</Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {latestMessageForSelected
              ? `${latestMessageForSelected.title} — ${latestMessageForSelected.body}`
              : 'No messages found.'}
          </Text>

          <Card mode="outlined" style={{ marginTop: 12 }}>
            <Card.Content>
              <TextInput
                mode="outlined"
                label="Reply"
                value={replyText}
                onChangeText={setReplyText}
                multiline
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                <IconButton
                  icon="send"
                  onPress={async () => {
                    const body = replyText.trim();
                    if (!body) return;
                    await sendAdminBroadcast({
                      title: selectedVehicleId ? `Reply to ${selectedVehicleId}` : 'Reply',
                      body,
                      recipients: 'school',
                      vehicleId: selectedVehicleId,
                    });
                    setMessageOpen(false);
                    setReplyText('');
                  }}
                  accessibilityLabel="Send reply"
                />
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
}
