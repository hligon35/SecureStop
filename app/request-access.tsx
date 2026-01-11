import { Link } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';

export default function RequestAccessScreen() {
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card mode="outlined">
        <Card.Title title="Request access" />
        <Card.Content style={{ gap: 10 }}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            To get an account, contact your school/agency administrator. They can create your profile and provide sign-in
            instructions.
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            If your organization uses SSO, you may only need to sign in once an admin has enabled your access.
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
