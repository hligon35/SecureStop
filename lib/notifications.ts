import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForNotificationsAsync(): Promise<string | undefined> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    finalStatus = req.status;
  }

  if (finalStatus !== 'granted') return undefined;

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export async function scheduleLocalAlertNotification(params: { title: string; body: string }) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
    },
    trigger: null,
  });
}
