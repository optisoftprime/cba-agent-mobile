import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';

/**
 * A single centred message with one action at the bottom — the shape shared by
 * "Device Activation Required" and "Code Verified".
 *
 * `icon` is a node so each screen picks its own mark and colour.
 */
export function MessageScreen({ icon = null, title, message, actionLabel, onAction }) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        {icon}
        <Text className="mt-6 text-center text-[19px] font-bold text-ink">{title}</Text>
        {message ? (
          <Text className="mt-2.5 text-center text-[14px] leading-6 text-ink-muted">{message}</Text>
        ) : null}
      </View>

      {actionLabel ? (
        <View className="px-6 pb-8">
          <Button label={actionLabel} size="lg" onPress={onAction} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
