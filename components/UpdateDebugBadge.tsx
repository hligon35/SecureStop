import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Text, useTheme } from "react-native-paper";

function getShortValue(value: string | null | undefined) {
  if (!value) return "none";
  return value.slice(-8);
}

export function UpdateDebugBadge() {
  const theme = useTheme();
  const updateInfo = Updates as typeof Updates & {
    channel?: string;
  };

  const source = updateInfo.isEmbeddedLaunch ? "embedded" : "ota";
  const updateId = getShortValue(updateInfo.updateId);
  const channel = updateInfo.channel ?? "unknown";
  const runtimeVersion = String(updateInfo.runtimeVersion ?? "unknown");
  const appVersion =
    Constants.expoConfig?.version ??
    Constants.manifest2?.extra?.expoClient?.version ??
    "unknown";

  return (
    <Text
      variant="labelSmall"
      style={{
        color: theme.colors.onSurfaceVariant,
        opacity: 0.9,
        textAlign: "center",
      }}
    >
      {`Build ${appVersion} | ${source} | ch ${channel} | rt ${runtimeVersion} | upd ${updateId}`}
    </Text>
  );
}
