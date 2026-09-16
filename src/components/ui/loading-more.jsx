import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * THE next-page footer. Every infinite list shows this one while the following
 * page is in flight, so "loading more" looks identical everywhere.
 *
 * Renders nothing when `active` is false, so it can be handed to
 * `ListFooterComponent` unconditionally:
 *
 *   ListFooterComponent={<LoadingMore active={isFetchingNextPage} />}
 *
 * This is NOT the first-page state — that's a skeleton shaped like the content
 * (`ui/skeleton`). A spinner here is right because the list above it is already
 * on screen and nothing is about to move.
 */
export function LoadingMore({ active = false }) {
  const { colors } = useTheme();

  if (!active) return null;

  return (
    <View className="py-6">
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
