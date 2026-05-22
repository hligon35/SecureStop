import { Link } from "expo-router";
import { View } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";

import { PublicScreenLayout } from "../components/PublicScreenLayout";

export default function RequestAccessScreen() {
  const theme = useTheme();

  return (
    <PublicScreenLayout
      title="Request Access"
      subtitle="Contact your organization to get invited and complete account setup."
    >
      <Card mode="outlined">
        <Card.Title title="Request access" />
        <Card.Content style={{ gap: 10 }}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            To get an account, contact your school/agency administrator. They
            can create your profile and provide sign-in instructions.
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            If your organization uses SSO, you may only need to sign in once an
            admin has enabled your access.
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
            <Link href="/login" asChild>
              <Button mode="contained">Back to login</Button>
            </Link>
          </View>
        </Card.Content>
      </Card>
    </PublicScreenLayout>
  );
}
