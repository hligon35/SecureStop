import 'react-native-gesture-handler';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { useColorScheme } from '@/components/useColorScheme';
import { getConfig } from '@/lib/config';
import { startDriverForegroundTracking } from '@/lib/location/tracking';
import { registerForNotificationsAsync } from '@/lib/notifications';
import { registerExpoPushToken } from '@/lib/push/register';
import { useAdminRegistryStore } from '@/store/adminRegistry';
import { useAuthStore } from '@/store/auth';
import { useIncidentsStore } from '@/store/incidents';
import { useNotificationStore } from '@/store/notifications';
import * as Notifications from 'expo-notifications';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  const paperTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  const setExpoPushToken = useNotificationStore((s) => s.setExpoPushToken);
  const receiveAlert = useNotificationStore((s) => s.receiveAlert);
  const role = useAuthStore((s) => s.role);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrateNotifications = useNotificationStore((s) => s.hydrate);
  const hydrateIncidents = useIncidentsStore((s) => s.hydrate);
  const hydrateRegistry = useAdminRegistryStore((s) => s.hydrate);

  useEffect(() => {
    hydrateAuth().catch(() => {
      // Ignore hydration failures in scaffold.
    });
    hydrateNotifications().catch(() => {
      // Ignore hydration failures in scaffold.
    });
    hydrateIncidents().catch(() => {
      // Ignore hydration failures in scaffold.
    });
    hydrateRegistry().catch(() => {
      // Ignore hydration failures in scaffold.
    });
  }, [hydrateAuth, hydrateIncidents, hydrateNotifications, hydrateRegistry]);

  useEffect(() => {
    let mounted = true;
    const cfg = getConfig();
    registerForNotificationsAsync()
      .then((token) => {
        if (!mounted) return;
        if (!token) return;

        setExpoPushToken(token);
        if (cfg.features.enablePushTokenRegistration) {
          registerExpoPushToken({ token, platform: Platform.OS }).catch(() => {
            // Backend may not exist yet.
          });
        }
      })
      .catch(() => {
        // Ignore for scaffold; permissions can be denied.
      });

    const sub = Notifications.addNotificationReceivedListener((n) => {
      const title = n.request.content.title ?? 'Notification';
      const body = n.request.content.body ?? '';
      receiveAlert({
        id: `notif-${Date.now()}`,
        title,
        body,
        recipients: 'both',
        createdAt: Date.now(),
        createdByRole: 'admin',
      });
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [receiveAlert, setExpoPushToken]);

  useEffect(() => {
    const cfg = getConfig();
    if (!cfg.features.enableDriverGps) return;
    if (role !== 'driver') return;

    let handle: { stop: () => void } | undefined;
    startDriverForegroundTracking({ postToBackend: true })
      .then((h) => {
        handle = h;
      })
      .catch(() => {
        // Permission denied or unavailable.
      });

    return () => {
      handle?.stop();
    };
  }, [role]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View style={{ flex: 1 }}>
            {isAuthenticated ? <AppHeader /> : null}
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(parent)" />
              <Stack.Screen name="(driver)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </View>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
