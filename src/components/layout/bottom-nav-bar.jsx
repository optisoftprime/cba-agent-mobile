import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_PERMISSION } from '@/api/permissions';
import { usePermissions } from '@/providers/permission-provider';
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
 *
 * A tab the agent lacks the permission for is FADED and opens the "ask your
 * administrator" modal instead of navigating — the same treatment as every
 * other gated control, rather than disappearing and changing the bar's shape
 * between agents. The destination screen checks too (`layout/locked-screen`),
 * so this is the courtesy, not the lock.
 */
export function BottomNavBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  // can/guard rather than usePermission(code): the tabs are a list, and a hook
  // cannot be called per item.
  const { can, guard } = usePermissions();

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
        const permission = TAB_PERMISSION[route.name];
        const locked = !can(permission);

        const onPress = () =>
          guard(permission, () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          });

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused, disabled: locked }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            onPress={onPress}
            onLongPress={onLongPress}
            className={`flex-1 items-center justify-center gap-0.5 py-1 ${
              locked ? 'opacity-50' : ''
            }`}>
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
