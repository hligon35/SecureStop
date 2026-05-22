import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Avatar, Card, Divider, Text, useTheme } from "react-native-paper";

import { useAdminRegistryStore } from "@/store/adminRegistry";
import { useAuthStore } from "@/store/auth";

const DRIVERS_WIDE_BREAKPOINT = 1024;
const DIRECTORY_PANEL_WIDTH = 304;

type DriverDetailSection = "driving-record" | "blank-one" | "blank-two";

function initialsFromName(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "DR";
}

export default function AdminDriversScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const wideLayout = width >= DRIVERS_WIDE_BREAKPOINT;
  const tenantId = useAuthStore((state) => state.schoolId || state.tenantId);

  const hydrated = useAdminRegistryStore((state) => state.hydrated);
  const ensureTenant = useAdminRegistryStore((state) => state.ensureTenant);
  const registry = useAdminRegistryStore((state) =>
    tenantId ? state.byTenant[tenantId] : undefined,
  );

  const drivers = useMemo(
    () =>
      [...(registry?.drivers ?? [])].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    [registry?.drivers],
  );

  const vehicles = registry?.vehicles ?? [];
  const routes = registry?.routes ?? [];

  const [selectedDriverId, setSelectedDriverId] = useState<
    string | undefined
  >();
  const [activeDetailSection, setActiveDetailSection] =
    useState<DriverDetailSection>("driving-record");

  useEffect(() => {
    if (!tenantId) return;
    ensureTenant(tenantId);
  }, [ensureTenant, tenantId]);

  useEffect(() => {
    if (drivers.length === 0) {
      setSelectedDriverId(undefined);
      return;
    }

    if (
      !selectedDriverId ||
      !drivers.some((driver) => driver.id === selectedDriverId)
    ) {
      setSelectedDriverId(drivers[0].id);
    }
  }, [drivers, selectedDriverId]);

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === selectedDriverId),
    [drivers, selectedDriverId],
  );

  const assignedVehicle = useMemo(
    () =>
      selectedDriver?.assignedVehicleId
        ? vehicles.find(
            (vehicle) => vehicle.id === selectedDriver.assignedVehicleId,
          )
        : undefined,
    [selectedDriver, vehicles],
  );

  const assignedRoute = useMemo(
    () =>
      selectedDriver
        ? routes.find((route) => route.driverId === selectedDriver.id)
        : undefined,
    [routes, selectedDriver],
  );

  const availabilityLabel = selectedDriver
    ? selectedDriver.active
      ? selectedDriver.assignedVehicleId
        ? "Assigned"
        : "Standby"
      : "Off clock"
    : "—";

  const detailButtons: Array<{
    key: DriverDetailSection;
    label: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  }> = [
    {
      key: "driving-record",
      label: "Driving record",
      icon: "card-account-details-outline",
    },
    {
      key: "blank-one",
      label: "Blank 1",
      icon: "file-document-outline",
    },
    {
      key: "blank-two",
      label: "Blank 2",
      icon: "clipboard-text-outline",
    },
  ];

  const detailButtonWidth = wideLayout ? 112 : 96;

  const detailSectionTitle =
    activeDetailSection === "driving-record"
      ? "Driving Record"
      : activeDetailSection === "blank-one"
        ? "Blank 1"
        : "Blank 2";

  const detailSectionContent = selectedDriver ? (
    activeDetailSection === "driving-record" ? (
      <>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <Card mode="outlined" style={{ minWidth: 150, flexGrow: 1 }}>
            <Card.Content style={{ paddingVertical: 10, gap: 2 }}>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Active record
              </Text>
              <Text>{selectedDriver.active ? "Yes" : "No"}</Text>
            </Card.Content>
          </Card>

          <Card mode="outlined" style={{ minWidth: 150, flexGrow: 1 }}>
            <Card.Content style={{ paddingVertical: 10, gap: 2 }}>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Assigned vehicle
              </Text>
              <Text>
                {assignedVehicle?.id ??
                  selectedDriver.assignedVehicleId ??
                  "None"}
              </Text>
            </Card.Content>
          </Card>

          <Card mode="outlined" style={{ minWidth: 150, flexGrow: 1 }}>
            <Card.Content style={{ paddingVertical: 10, gap: 2 }}>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Route
              </Text>
              <Text>{assignedRoute?.id ?? "None"}</Text>
            </Card.Content>
          </Card>

          <Card mode="outlined" style={{ minWidth: 150, flexGrow: 1 }}>
            <Card.Content style={{ paddingVertical: 10, gap: 2 }}>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                License on file
              </Text>
              <Text>{selectedDriver.licenseId ? "Verified" : "Missing"}</Text>
            </Card.Content>
          </Card>
        </View>

        <Divider />

        <View style={{ gap: 8 }}>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Notes
          </Text>
          <Text variant="bodyMedium">
            Directory records remain visible here even when a driver is inactive
            or not currently assigned to a vehicle. Use the assignment and
            status fields above to distinguish rostered, standby, and off-clock
            drivers.
          </Text>
        </View>
      </>
    ) : activeDetailSection === "blank-one" ? (
      <>
        <Card mode="outlined">
          <Card.Content style={{ gap: 6 }}>
            <Text variant="titleSmall">Blank 1</Text>
            <Text variant="bodyMedium">
              This panel is reserved for an additional driver profile view.
            </Text>
          </Card.Content>
        </Card>
        <View style={{ gap: 8 }}>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Planned content
          </Text>
          <Text variant="bodyMedium">
            Add any future compliance, training, or employment data here without
            changing the credential card above.
          </Text>
        </View>
      </>
    ) : (
      <>
        <Card mode="outlined">
          <Card.Content style={{ gap: 6 }}>
            <Text variant="titleSmall">Blank 2</Text>
            <Text variant="bodyMedium">
              This panel is reserved for another driver-focused detail view.
            </Text>
          </Card.Content>
        </Card>
        <View style={{ gap: 8 }}>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Planned content
          </Text>
          <Text variant="bodyMedium">
            Use this space for incident history, shift notes, or any other
            secondary directory details.
          </Text>
        </View>
      </>
    )
  ) : null;

  const directoryList = (
    <View style={{ gap: 8 }}>
      {drivers.map((driver) => {
        const active = driver.id === selectedDriverId;

        return (
          <Pressable
            key={driver.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${driver.name}`}
            onPress={() => setSelectedDriverId(driver.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderRadius: 16,
              paddingHorizontal: 10,
              paddingVertical: 10,
              backgroundColor: active
                ? theme.colors.secondaryContainer
                : theme.colors.surface,
              borderWidth: 1,
              borderColor: active
                ? theme.colors.primary
                : theme.colors.outlineVariant,
            }}
          >
            <Avatar.Text
              size={42}
              label={initialsFromName(driver.name)}
              style={{
                backgroundColor: active
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceVariant,
              }}
              color={
                active
                  ? theme.colors.onPrimaryContainer
                  : theme.colors.onSurfaceVariant
              }
            />

            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text
                variant="titleSmall"
                numberOfLines={1}
                style={{
                  color: active
                    ? theme.colors.onSecondaryContainer
                    : theme.colors.onSurface,
                }}
              >
                {driver.name}
              </Text>
              <Text
                variant="bodySmall"
                numberOfLines={1}
                style={{
                  color: active
                    ? theme.colors.onSecondaryContainer
                    : theme.colors.onSurfaceVariant,
                }}
              >
                {driver.active ? "Active in directory" : "Inactive / off clock"}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        flexDirection: wideLayout ? "row" : "column",
        backgroundColor: theme.colors.background,
      }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 16,
        }}
      >
        <View style={{ gap: 4, paddingBottom: 8 }}>
          <Text variant="titleSmall">Driver Directory</Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            All drivers in the system, including inactive and off-clock staff.
          </Text>
        </View>
        <Divider />

        {!hydrated || !tenantId ? (
          <Card mode="outlined" style={{ marginTop: 12 }}>
            <Card.Content style={{ gap: 8 }}>
              <Text variant="titleSmall">Loading directory</Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Preparing tenant driver records.
              </Text>
            </Card.Content>
          </Card>
        ) : drivers.length === 0 ? (
          <Card mode="outlined" style={{ marginTop: 12 }}>
            <Card.Content style={{ gap: 8 }}>
              <Text variant="titleSmall">No drivers found</Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                This tenant does not have any saved driver records yet.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={{ flex: 1, gap: 12, paddingTop: 12 }}>
            {!wideLayout ? (
              <Card mode="outlined">
                <Card.Content style={{ gap: 10 }}>
                  <Text variant="titleSmall">Directory</Text>
                  {directoryList}
                </Card.Content>
              </Card>
            ) : null}

            {selectedDriver ? (
              <>
                <View style={{ gap: 20 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 16,
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ width: detailButtonWidth, gap: 10 }}>
                      {detailButtons.map((button) => {
                        const active = button.key === activeDetailSection;
                        const labelLines = button.label.split(" ");

                        return (
                          <Pressable
                            key={button.key}
                            accessibilityRole="button"
                            accessibilityLabel={button.label}
                            onPress={() => setActiveDetailSection(button.key)}
                            style={{
                              minHeight: detailButtonWidth,
                              borderRadius: 22,
                              borderWidth: 1,
                              borderColor: active
                                ? theme.colors.primary
                                : theme.colors.outlineVariant,
                              backgroundColor: active
                                ? theme.colors.secondaryContainer
                                : theme.colors.surface,
                              alignItems: "center",
                              justifyContent: "center",
                              paddingHorizontal: 6,
                              paddingVertical: 60,
                              gap: 6,
                            }}
                          >
                            <MaterialCommunityIcons
                              name={button.icon}
                              size={24}
                              color={
                                active
                                  ? theme.colors.onSecondaryContainer
                                  : theme.colors.onSurfaceVariant
                              }
                            />
                            <View style={{ alignItems: "center" }}>
                              {labelLines.map((line) => (
                                <Text
                                  key={`${button.key}-${line}`}
                                  variant="labelMedium"
                                  style={{
                                    textAlign: "center",
                                    color: active
                                      ? theme.colors.onSecondaryContainer
                                      : theme.colors.onSurface,
                                  }}
                                >
                                  {line}
                                </Text>
                              ))}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Card
                        mode="outlined"
                        style={{ minHeight: 220, overflow: "hidden" }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            backgroundColor: theme.colors.primaryContainer,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.outlineVariant,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <MaterialCommunityIcons
                              name="card-account-details-outline"
                              size={20}
                              color={theme.colors.onPrimaryContainer}
                            />
                            <Text
                              variant="titleSmall"
                              style={{ color: theme.colors.onPrimaryContainer }}
                            >
                              Driver Credentials
                            </Text>
                          </View>
                          <Text
                            variant="labelSmall"
                            style={{ color: theme.colors.onPrimaryContainer }}
                          >
                            {selectedDriver.active ? "ACTIVE" : "OFF CLOCK"}
                          </Text>
                        </View>

                        <Card.Content style={{ paddingTop: 16, gap: 16 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 16,
                              alignItems: "flex-start",
                            }}
                          >
                            <View
                              style={{
                                alignItems: "center",
                                gap: 10,
                                width: 116,
                              }}
                            >
                              <Avatar.Text
                                size={88}
                                label={initialsFromName(selectedDriver.name)}
                                style={{
                                  backgroundColor:
                                    theme.colors.primaryContainer,
                                }}
                                color={theme.colors.onPrimaryContainer}
                              />
                              <Card mode="outlined" style={{ width: "100%" }}>
                                <Card.Content
                                  style={{
                                    paddingVertical: 10,
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  <Text
                                    variant="labelSmall"
                                    style={{
                                      color: theme.colors.onSurfaceVariant,
                                    }}
                                  >
                                    License
                                  </Text>
                                  <Text variant="titleSmall">
                                    {selectedDriver.licenseId ?? "Pending"}
                                  </Text>
                                </Card.Content>
                              </Card>
                            </View>

                            <View style={{ flex: 1, minWidth: 0, gap: 12 }}>
                              <View style={{ flexDirection: "row", gap: 12 }}>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <Text
                                    variant="labelSmall"
                                    style={{
                                      color: theme.colors.onSurfaceVariant,
                                    }}
                                  >
                                    Driver name
                                  </Text>
                                  <Text
                                    variant="headlineSmall"
                                    numberOfLines={2}
                                  >
                                    {selectedDriver.name}
                                  </Text>
                                </View>
                                <View style={{ width: 110 }}>
                                  <Text
                                    variant="labelSmall"
                                    style={{
                                      color: theme.colors.onSurfaceVariant,
                                    }}
                                  >
                                    Driver ID
                                  </Text>
                                  <Text variant="titleMedium">
                                    {selectedDriver.id}
                                  </Text>
                                </View>
                              </View>

                              <View
                                style={{
                                  flexDirection: "row",
                                  flexWrap: "wrap",
                                  gap: 12,
                                }}
                              >
                                <View style={{ minWidth: 120, flexGrow: 1 }}>
                                  <Text
                                    variant="labelSmall"
                                    style={{
                                      color: theme.colors.onSurfaceVariant,
                                    }}
                                  >
                                    Phone
                                  </Text>
                                  <Text>
                                    {selectedDriver.phone ?? "Not on file"}
                                  </Text>
                                </View>

                                <View style={{ minWidth: 120, flexGrow: 1 }}>
                                  <Text
                                    variant="labelSmall"
                                    style={{
                                      color: theme.colors.onSurfaceVariant,
                                    }}
                                  >
                                    Vehicle assignment
                                  </Text>
                                  <Text>
                                    {assignedVehicle?.label ??
                                      selectedDriver.assignedVehicleId ??
                                      "Unassigned"}
                                  </Text>
                                </View>
                              </View>

                              <View
                                style={{
                                  flexDirection: "row",
                                  flexWrap: "wrap",
                                  gap: 12,
                                }}
                              >
                                <View style={{ minWidth: 120, flexGrow: 1 }}>
                                  <Text
                                    variant="labelSmall"
                                    style={{
                                      color: theme.colors.onSurfaceVariant,
                                    }}
                                  >
                                    Route assignment
                                  </Text>
                                  <Text>
                                    {assignedRoute?.name ??
                                      assignedRoute?.id ??
                                      "No route assigned"}
                                  </Text>
                                </View>

                                <View style={{ minWidth: 120, flexGrow: 1 }}>
                                  <Text
                                    variant="labelSmall"
                                    style={{
                                      color: theme.colors.onSurfaceVariant,
                                    }}
                                  >
                                    Directory status
                                  </Text>
                                  <Text>{availabilityLabel}</Text>
                                </View>
                              </View>

                              <View
                                style={{
                                  marginTop: 4,
                                  borderTopWidth: 1,
                                  borderTopColor: theme.colors.outlineVariant,
                                  paddingTop: 10,
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  gap: 12,
                                }}
                              >
                                <Text
                                  variant="labelSmall"
                                  style={{
                                    color: theme.colors.onSurfaceVariant,
                                  }}
                                >
                                  Credential ID: CDL-{selectedDriver.id}
                                </Text>
                                <Text
                                  variant="labelSmall"
                                  style={{
                                    color: theme.colors.onSurfaceVariant,
                                  }}
                                >
                                  Tenant: {tenantId}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </Card.Content>
                      </Card>
                    </View>
                  </View>

                  <View
                    style={{
                      minHeight: 340,
                      marginTop: 8,
                      paddingTop: 8,
                    }}
                  >
                    <Text variant="titleSmall">{detailSectionTitle}</Text>
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{
                        gap: 12,
                        paddingTop: 12,
                        paddingBottom: 20,
                      }}
                    >
                      {detailSectionContent}
                    </ScrollView>
                  </View>
                </View>
              </>
            ) : null}
          </View>
        )}
      </View>

      {wideLayout ? (
        <View
          style={{
            width: DIRECTORY_PANEL_WIDTH,
            borderLeftWidth: 1,
            borderLeftColor: theme.colors.outlineVariant,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: 14,
            paddingVertical: 12,
            gap: 10,
          }}
        >
          <Text variant="titleSmall">Drivers</Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Select a driver to open credentials and roster details.
          </Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {directoryList}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
