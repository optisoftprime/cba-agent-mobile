import { Pressable, ScrollView, Text, View } from 'react-native';

/**
 * Single-select pill row; the selected chip fills with the brand colour.
 *
 * `options` is [{ value, label }]. By default the row scrolls horizontally, so
 * adding a filter never breaks the layout. Pass `fill` for a small fixed set
 * (priority: Low / Medium / High) to share the width evenly instead.
 */
export function FilterChips({ options, value, onChange, fill = false, className = '' }) {
  const chips = options.map((option) => {
    const selected = option.value === value;

    return (
      <Pressable
        key={option.value}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => onChange?.(option.value)}
        className={`h-9 items-center justify-center rounded-full px-5 ${fill ? 'flex-1' : ''} ${
          selected ? 'bg-primary' : 'border border-line bg-card active:bg-card-muted'
        }`}>
        <Text
          numberOfLines={1}
          className={`text-[13px] font-medium ${selected ? 'text-on-primary' : 'text-ink-muted'}`}>
          {option.label}
        </Text>
      </Pressable>
    );
  });

  if (fill) {
    return <View className={`flex-row gap-3 ${className}`}>{chips}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      className={className}>
      {chips}
    </ScrollView>
  );
}
