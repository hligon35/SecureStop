import { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export function PublicScreenLayout(props: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 16,
          gap: 12,
        }}
      >
        <View style={{ alignItems: "center", gap: 4, paddingTop: 4 }}>
          <Text variant="headlineSmall">SecureStop</Text>
          <Text variant="titleSmall">{props.title}</Text>
          {props.subtitle ? (
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
                maxWidth: 420,
              }}
            >
              {props.subtitle}
            </Text>
          ) : null}
        </View>

        {props.children}
      </ScrollView>
    </SafeAreaView>
  );
}
