import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import {
    Button,
    Card,
    Dialog,
    Divider,
    IconButton,
    Portal,
    Snackbar,
    Switch,
    Text,
    TextInput,
    useTheme,
} from "react-native-paper";

import { PasswordFields, validatePassword } from "@/components/PasswordFields";
import type { Role } from "@/constants/roles";
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";

function displayNameForRole(params: { role: Role; userId: string }) {
  const { role, userId } = params;
  if (userId !== "mock-user") return userId;
  if (role === "admin") return "Admin User";
  if (role === "driver") return "Driver User";
  return "Parent User";
}

export function ProfileScreen(props: {
  role: Role;
  childrenSection?: React.ReactNode;
}) {
  const theme = useTheme();

  const email = useAuthStore((s) => s.email);
  const homeAddress = useAuthStore((s) => s.homeAddress);
  const passwordMock = useAuthStore((s) => s.passwordMock);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const signOut = useAuthStore((s) => s.signOut);
  const setAccount = useAuthStore((s) => s.setAccount);
  const userId = useAuthStore((s) => s.userId);

  const prefs = useNotificationStore((s) => s.prefs);
  const setPrefs = useNotificationStore((s) => s.setPrefs);

  const [isEditing, setIsEditing] = useState(false);
  const [draftEmail, setDraftEmail] = useState(email);
  const [draftHomeAddress, setDraftHomeAddress] = useState(homeAddress);
  const [draftPassword, setDraftPassword] = useState(passwordMock);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountBusy, setAccountBusy] = useState<"delete" | "logout" | null>(
    null,
  );
  const [snack, setSnack] = useState<string | null>(null);

  const name = useMemo(
    () => displayNameForRole({ role: props.role, userId }),
    [props.role, userId],
  );
  const phone = "(555) 010-2040";

  const isChangingPassword =
    draftPassword.trim().length > 0 || confirmPassword.trim().length > 0;
  const passwordValid = validatePassword(draftPassword).meetsAll;
  const confirmMatches = draftPassword === confirmPassword;
  const canFinishEditing =
    !isChangingPassword || (passwordValid && confirmMatches);

  function startEditing() {
    setDraftEmail(email);
    setDraftHomeAddress(homeAddress);
    setDraftPassword(passwordMock);
    setConfirmPassword("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftEmail(email);
    setDraftHomeAddress(homeAddress);
    setDraftPassword(passwordMock);
    setConfirmPassword("");
    setIsEditing(false);
    setSnack("Changes discarded");
  }

  function finishEditing() {
    if (!canFinishEditing) {
      setSnack("Password must meet requirements and match confirmation.");
      return;
    }

    setAccount({
      email: draftEmail,
      homeAddress: draftHomeAddress,
      passwordMock: draftPassword,
    });
    setConfirmPassword("");
    setIsEditing(false);
    setSnack("Profile saved");
  }

  function handleSignOut() {
    setAccountBusy("logout");
    signOut();
    setAccountBusy(null);
    setSnack("Signed out");
  }

  async function handleDeleteAccount() {
    setAccountBusy("delete");
    try {
      const result = await deleteAccount();
      setDeleteDialogOpen(false);
      setSnack(
        result.deletedRemotely
          ? "Account deleted"
          : "Local demo account cleared",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete account.";
      setSnack(message);
    } finally {
      setAccountBusy(null);
    }
  }

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card mode="outlined">
          <Card.Content style={{ gap: 10 }}>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Profile
            </Text>

            <Divider style={{ marginTop: 4, marginBottom: 6, opacity: 0.25 }} />

            <IconButton
              icon="pencil"
              mode="contained"
              size={18}
              containerColor={theme.colors.surfaceVariant}
              accessibilityLabel="Edit profile"
              style={{ position: "absolute", right: 8, top: 8, zIndex: 2 }}
              disabled={isEditing}
              onPress={startEditing}
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Name
              </Text>
              <Text>{name}</Text>
            </View>

            {isEditing ? (
              <>
                <TextInput
                  label="Email"
                  value={draftEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={isEditing}
                  onChangeText={setDraftEmail}
                />

                <TextInput
                  label="Home address"
                  value={draftHomeAddress}
                  editable={isEditing}
                  onChangeText={setDraftHomeAddress}
                />

                <PasswordFields
                  password={draftPassword}
                  confirmPassword={confirmPassword}
                  onChangePassword={setDraftPassword}
                  onChangeConfirmPassword={setConfirmPassword}
                  editable={isEditing}
                  hideDivider
                />

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <Button mode="text" onPress={cancelEditing}>
                    Cancel
                  </Button>
                  <Button mode="contained" onPress={finishEditing}>
                    Save
                  </Button>
                </View>
              </>
            ) : (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Email
                  </Text>
                  <Text>{email}</Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Home address
                  </Text>
                  <Text>{homeAddress}</Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Password
                  </Text>
                  <Text>{passwordMock ? "••••••••" : "Not set"}</Text>
                </View>
              </>
            )}

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Phone
              </Text>
              <Text>{phone}</Text>
            </View>

            {props.childrenSection ? (
              <View style={{ marginTop: 8 }}>{props.childrenSection}</View>
            ) : null}
          </Card.Content>
        </Card>

        <View style={{ gap: 12 }}>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Notifications
          </Text>
          <Divider style={{ marginTop: -6, marginBottom: 6, opacity: 0.25 }} />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text>Notifications enabled</Text>
            <Switch
              value={prefs.enabled}
              onValueChange={(v) => setPrefs({ enabled: v })}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text>Receive driver alerts</Text>
            <Switch
              value={prefs.receiveDriverAlerts}
              onValueChange={(v) => setPrefs({ receiveDriverAlerts: v })}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text>Receive admin broadcasts</Text>
            <Switch
              value={prefs.receiveAdminBroadcasts}
              onValueChange={(v) => setPrefs({ receiveAdminBroadcasts: v })}
            />
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Account
          </Text>
          <Divider style={{ marginTop: -6, marginBottom: 6, opacity: 0.25 }} />

          <Button
            mode="outlined"
            icon="logout"
            disabled={accountBusy !== null}
            onPress={handleSignOut}
          >
            {accountBusy === "logout" ? "Signing out..." : "Log out"}
          </Button>

          <Button
            mode="contained-tonal"
            icon="delete-outline"
            buttonColor={theme.colors.errorContainer}
            textColor={theme.colors.onErrorContainer}
            disabled={accountBusy !== null}
            onPress={() => setDeleteDialogOpen(true)}
          >
            Delete account
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={deleteDialogOpen}
          onDismiss={() => {
            if (accountBusy) return;
            setDeleteDialogOpen(false);
          }}
        >
          <Dialog.Title>Delete account?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This will sign you out and remove your account data from this app.
              Firebase-backed accounts will also be deleted remotely.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setDeleteDialogOpen(false)}
              disabled={accountBusy !== null}
            >
              Cancel
            </Button>
            <Button
              onPress={handleDeleteAccount}
              disabled={accountBusy !== null}
              textColor={theme.colors.error}
            >
              {accountBusy === "delete" ? "Deleting..." : "Delete"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack(null)}
        duration={2400}
      >
        {snack ?? ""}
      </Snackbar>
    </>
  );
}
