import { Pressable, Text as RNText, ScrollView, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";

import type { AlertSeverity } from "@/store/notifications";
import { useNotificationStore } from "@/store/notifications";
import { useTripStore } from "@/store/trip";

export default function DriverDelayScreen() {
  const theme = useTheme();

  const sendDriverAlert = useNotificationStore((s) => s.sendDriverAlert);

  const vehicleId = useTripStore((s) => s.vehicleId);

  function severityButtonColor(sev: AlertSeverity) {
    switch (sev) {
      case "green":
        return theme.colors.tertiary;
      case "yellow":
        return theme.colors.secondary;
      case "orange":
        return theme.colors.secondaryContainer;
      case "red":
        return theme.colors.error;
    }
  }

  const alertButtons: Array<{
    id: string;
    label: string;
    severity: AlertSeverity;
  }> = [
    {
      id: "medical_emergency_onboard",
      label: "Medical Emergency\nOnboard",
      severity: "red",
    },
    { id: "passenger_injury", label: "Passenger\nInjury", severity: "red" },
    {
      id: "vehicle_accident_collision",
      label: "Accident /\nCollision",
      severity: "red",
    },

    {
      id: "bus_disabled_in_roadway",
      label: "Bus Disabled\nIn Roadway",
      severity: "red",
    },
    {
      id: "fire_smoke_detected",
      label: "Fire / Smoke\nDetected",
      severity: "red",
    },
    {
      id: "active_threat_security_concern",
      label: "Active Threat\n/ Security",
      severity: "red",
    },

    {
      id: "child_left_on_bus_post_trip_check_failed",
      label: "Child Left\nOn Bus",
      severity: "red",
    },
    {
      id: "evacuation_in_progress",
      label: "Evacuation\nIn Progress",
      severity: "red",
    },
    {
      id: "severe_mechanical_failure_unsafe_to_drive",
      label: "Severe Mechanical\nFailure",
      severity: "red",
    },

    {
      id: "lost_child_missing_passenger_at_stop",
      label: "Lost Child / Missing\nPassenger At Stop",
      severity: "red",
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
      >
        <Card>
          <Card.Content style={{ gap: 12 }}>
            <Text variant="titleMedium" style={{ textAlign: "center" }}>
              Emergency Alerts
            </Text>

            <Text variant="labelSmall" style={{ textAlign: "center" }}>
              All alerts go to School/Admin.
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "space-between",
              }}
            >
              {alertButtons.map((b) => (
                <Pressable
                  key={b.id}
                  accessibilityRole="button"
                  hitSlop={6}
                  onPress={() => {
                    sendDriverAlert({
                      templateId: b.id,
                      recipients: "school",
                      vehicleId,
                    });
                  }}
                  style={({ pressed }) => ({
                    width: "48%",
                    height: 96,
                    borderRadius: 20,
                    paddingHorizontal: 8,
                    paddingVertical: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: severityButtonColor(b.severity),
                    opacity: pressed ? 0.85 : 1,
                    overflow: "hidden",
                  })}
                >
                  <View
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    {b.label.split("\n").map((line, index) => (
                      <RNText
                        key={`${b.id}-${index}`}
                        style={{
                          textAlign: "center",
                          fontSize: 12,
                          lineHeight: 16,
                          fontWeight: "600",
                          color: theme.colors.onError,
                        }}
                      >
                        {line}
                      </RNText>
                    ))}
                  </View>
                </Pressable>
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}
