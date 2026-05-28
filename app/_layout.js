import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from '../context/UserContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="screens/discomfort" />
          <Stack.Screen name="screens/mental" />
          <Stack.Screen name="screens/ai" />
          <Stack.Screen name="screens/info" />
          <Stack.Screen name="screens/community" />
          <Stack.Screen name="screens/smalltalk" />
          <Stack.Screen name="screens/appliance" />
        </Stack>
      </UserProvider>
    </SafeAreaProvider>
  );
}