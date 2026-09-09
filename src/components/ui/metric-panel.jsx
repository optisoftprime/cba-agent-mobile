import { Text, View } from 'react-native';

/**
 * A tinted strip of label/value pairs inside a card — "Outstanding ₦650,000 |
 * Next Payment ₦41,850". Columns share the width evenly, so two or three
 * metrics both lay out correctly.
 */
export function MetricPanel({ items, className = '' }) {
  return (
    <View className={`flex-row gap-3 rounded-lg bg-card-muted px-3.5 py-3 ${className}`}>
      {items.map((item) => (
        <View key={item.label} className="flex-1">
          <Text className="text-[11px] text-ink-muted" numberOfLines={1}>
            {item.label}
          </Text>
          <Text className="mt-1 text-[15px] font-bold text-ink" numberOfLines={1}>
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
