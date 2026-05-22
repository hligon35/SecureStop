import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { IconButton, Text, useTheme } from "react-native-paper";

type AdminTabDrawerItem = {
  href: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
};

const ADMIN_TAB_ITEMS: AdminTabDrawerItem[] = [
  { href: "/(admin)/(tabs)/fleet", icon: "bus", title: "Fleet" },
  { href: "/(admin)/(tabs)/routes", icon: "map-marker-path", title: "Routes" },
  { href: "/(admin)/(tabs)/scans", icon: "qrcode-scan", title: "Scans" },
  {
    href: "/(admin)/(tabs)/drivers",
    icon: "card-account-details-outline",
    title: "Drivers",
  },
];

export function AdminTabDrawer(props: {
  collapsed: boolean;
  currentPath: string;
  onNavigate: (href: string) => void;
  onToggleCollapsed: () => void;
}) {
  const theme = useTheme();
  const drawerWidth = props.collapsed ? 48 : 156;

  return (
    <View
      style={{
        width: drawerWidth,
        backgroundColor: theme.colors.surface,
        borderRightWidth: 1,
        borderRightColor: theme.colors.outlineVariant,
        paddingHorizontal: props.collapsed ? 6 : 12,
        paddingVertical: 12,
        gap: 10,
      }}
    >
      <View
        style={{
          flexDirection: props.collapsed ? "column" : "row",
          alignItems: "center",
          justifyContent: props.collapsed ? "center" : "space-between",
          gap: 4,
        }}
      >
        {props.collapsed ? null : <Text variant="titleSmall">Navigate</Text>}
        <IconButton
          icon={
            props.collapsed ? "chevron-double-right" : "chevron-double-left"
          }
          mode="contained-tonal"
          size={18}
          accessibilityLabel={
            props.collapsed ? "Expand navigation" : "Collapse navigation"
          }
          style={{ margin: 0, width: 36, height: 36 }}
          onPress={props.onToggleCollapsed}
        />
      </View>

      <View style={{ gap: 6 }}>
        {ADMIN_TAB_ITEMS.map((item) => {
          const active = props.currentPath.startsWith(item.href);

          return (
            <Pressable
              key={item.href}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.title}`}
              onPress={() => props.onNavigate(item.href)}
              style={{
                minHeight: 46,
                borderRadius: 14,
                backgroundColor: active
                  ? theme.colors.secondaryContainer
                  : "transparent",
                paddingHorizontal: props.collapsed ? 0 : 12,
                paddingVertical: 10,
                alignItems: "center",
                justifyContent: props.collapsed ? "center" : "flex-start",
                flexDirection: props.collapsed ? "column" : "row",
                gap: props.collapsed ? 2 : 10,
              }}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={
                  active
                    ? theme.colors.onSecondaryContainer
                    : theme.colors.onSurfaceVariant
                }
              />
              {props.collapsed ? null : (
                <Text
                  variant="labelLarge"
                  style={{
                    color: active
                      ? theme.colors.onSecondaryContainer
                      : theme.colors.onSurface,
                  }}
                >
                  {item.title}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
