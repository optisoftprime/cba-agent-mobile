import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BottomNavBar } from '@/components/layout/bottom-nav-bar';

/** Filled when the tab is active, outline when it isn't. */
function tabIcon(name) {
  const TabIcon = ({ focused, color, size }) => (
    <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />
  );
  TabIcon.displayName = `TabIcon(${name})`;
  return TabIcon;
}

/**
 * Tab order, labels and icons. The bar itself is our own component
 * (BottomNavBar) — this file only declares what goes in it.
 */
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomNavBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen
        name="customers/index"
        options={{ title: t('tabs.customers'), tabBarIcon: tabIcon('people') }}
      />
      <Tabs.Screen
        name="loans/index"
        options={{ title: t('tabs.loans'), tabBarIcon: tabIcon('business') }}
      />
      <Tabs.Screen
        name="support/index"
        options={{ title: t('tabs.support'), tabBarIcon: tabIcon('headset') }}
      />
      <Tabs.Screen
        name="more/index"
        options={{ title: t('tabs.more'), tabBarIcon: tabIcon('menu') }}
      />
    </Tabs>
  );
}
