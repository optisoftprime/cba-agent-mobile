import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';

/**
 * The app's bottom navigation bar.
 *
 * Passed to expo-router's <Tabs tabBar={...}> so the bar is our own component
 * rather than React Navigation's default — which means it is themed with the
 * same tokens as everything else, and any future design (a raised centre
 * button, a badge, a hidden tab) is a change in this one file.
 *
 * Each tab's label and icon still come from its `Tabs.Screen options`
 * (`title` and `tabBarIcon`), so the layout file stays the place you go to add
 * or reorder tabs.
 */
export function BottomNavBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      className="flex-row border-t border-line bg-card pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        if (options.href === null) return null;

        const focused = state.index === index;
        const label = options.title ?? route.name;
        const tint = focused ? colors.primary : colors.inkSoft;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            onPress={onPress}
            onLongPress={onLongPress}
            className="flex-1 items-center justify-center gap-0.5 py-1">
            {options.tabBarIcon?.({ focused, color: tint, size: 22 })}
            <Text
              numberOfLines={1}
              className={`text-[11px] font-medium ${focused ? 'text-primary' : 'text-ink-soft'}`}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
