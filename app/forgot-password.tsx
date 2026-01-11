import { Link } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card mode="outlined">
        <Card.Title title="Reset password" />
        <Card.Content style={{ gap: 10 }}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Password reset is handled by your organization. If SSO is enabled, use your identity provider’s reset flow.
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            If you don’t have SSO, contact your dispatcher/admin to reset your account.
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
            <Link href="/login" asChild>
              <Button mode="contained">Back to login</Button>
            </Link>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
