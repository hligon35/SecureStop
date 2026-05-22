import { useMemo } from "react";
import type { DimensionValue, ImageSourcePropType } from "react-native";
import { Image, Pressable, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

export type VehicleSelectorGridItem = {
  id: string;
  label: string;
  iconSource?: ImageSourcePropType;
};

const DEFAULT_VEHICLE_ICON = require("../assets/images/sbus.png");

export function VehicleSelectorGrid(props: {
  items: VehicleSelectorGridItem[];
  activeId: string;
  columns?: number;
  onSelect: (id: string) => void;
  getAccessibilityLabel?: (item: VehicleSelectorGridItem) => string;
  overlayLabel?: boolean;
}) {
  const theme = useTheme();
  const columns = props.columns ?? 2;

  const itemWidth = useMemo<DimensionValue>(() => {
    if (columns <= 1) return "100%";
    return `${Math.floor(100 / columns) - 3}%`;
  }, [columns]);

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {props.items.map((item) => {
        const active = item.id === props.activeId;
        const iconSource = item.iconSource ?? DEFAULT_VEHICLE_ICON;
        const accessibilityLabel = props.getAccessibilityLabel
          ? props.getAccessibilityLabel(item)
          : `Select ${item.label}`;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={() => props.onSelect(item.id)}
            style={{
              width: itemWidth,
              minWidth: columns > 1 ? 108 : undefined,
            }}
          >
            <View
              style={{
                borderRadius: 16,
                borderWidth: active ? 2 : 1,
                borderColor: active
                  ? theme.colors.primary
                  : theme.colors.outline,
                backgroundColor: active
                  ? theme.colors.secondaryContainer
                  : theme.colors.surface,
                paddingVertical: 12,
                paddingHorizontal: 8,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <Image
                source={iconSource}
                style={{ width: 42, height: 42, resizeMode: "contain" }}
              />
              {props.overlayLabel ? (
                <Text
                  variant="labelSmall"
                  style={{
                    position: "absolute",
                    top: 17,
                    color: "black",
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </Text>
              ) : (
                <Text
                  variant="labelSmall"
                  style={{
                    color: active
                      ? theme.colors.onSecondaryContainer
                      : theme.colors.onSurface,
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
