import { useMemo } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { FlatList, Image, Pressable, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export type VehicleCarouselItem = {
  id: string;
  label: string;
  iconSource?: ImageSourcePropType;
};

export const VEHICLE_CAROUSEL_HEIGHT = 55;
export const VEHICLE_CAROUSEL_BOTTOM_OFFSET = 8;

const DEFAULT_VEHICLE_ICON = require('../assets/images/sbus.png');

export function VehicleCarousel(props: {
  items: VehicleCarouselItem[];
  activeId: string;
  onSelect: (id: string) => void;
  height?: number;
  bottomOffset?: number;
  style?: StyleProp<ViewStyle>;
  getAccessibilityLabel?: (item: VehicleCarouselItem) => string;
}) {
  const theme = useTheme();

  const height = props.height ?? VEHICLE_CAROUSEL_HEIGHT;
  const bottomOffset = props.bottomOffset ?? VEHICLE_CAROUSEL_BOTTOM_OFFSET;

  const contentContainerStyle = useMemo(
    () => ({ gap: 4, alignItems: 'flex-end' as const, paddingVertical: 0 }),
    []
  );

  return (
    <View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: bottomOffset,
          height,
          paddingHorizontal: 2,
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingVertical: 2.5,
          backgroundColor: '#f0f0f000',
        },
        props.style,
      ]}
    >
      <FlatList
        style={{ flexGrow: 0 }}
        horizontal
        data={props.items}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        renderItem={({ item }) => {
          const active = item.id === props.activeId;
          const iconSource = item.iconSource ?? DEFAULT_VEHICLE_ICON;
          const accessibilityLabel = props.getAccessibilityLabel
            ? props.getAccessibilityLabel(item)
            : item.id === 'fleet'
              ? 'Fleet routes'
              : `Route for bus ${item.label}`;

          return (
            <Pressable
              onPress={() => props.onSelect(item.id)}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              style={{ alignItems: 'center' }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  backgroundColor: theme.colors.surface,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? theme.colors.primary : theme.colors.outline,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image source={iconSource} style={{ width: 40, height: 40, resizeMode: 'contain' }} />
                <View style={{ position: 'absolute', bottom: 10, left: 2, right: 0, alignItems: 'center' }}>
                  <Text variant="labelSmall" style={{ color: 'black' }}>
                    {item.label}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
