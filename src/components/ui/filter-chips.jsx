import { Pressable, ScrollView, Text, View } from 'react-native';

/**
 * Single-select pill row; the selected chip fills with the brand colour.
 *
 * `options` is [{ value, label, disabled }]. By default the row scrolls
 * horizontally, so adding a filter never breaks the layout. Pass `fill` for a
 * small fixed set (priority: Low / Medium / High / Critical) to share the width
 * evenly instead.
 *
 * `disabled: true` fades a chip and stops it being pressed — for a filter the
 * backend lists but does not serve yet. Shown rather than hidden, so the agent
 * can see it is coming and does not wonder where it went.
 *
 * A `fill` chip gets a fixed share of the width, so its padding has to be tight
 * — at `px-5` four chips on a narrow handset left about 30dp for the label and
 * "Critical" clipped to nothing readable. The label also shrinks a little
 * rather than truncating, which covers longer translations (French "Priorité
 * critique") and a large system font size.
 */
export function FilterChips({ options, value, onChange, fill = false, className = '' }) {
  const chips = options.map((option) => {
    const selected = option.value === value;
    const disabled = Boolean(option.disabled);

    return (
      <Pressable
        key={option.value}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        onPress={() => onChange?.(option.value)}
        className={`h-9 items-center justify-center rounded-full ${
          fill ? 'flex-1 px-2' : 'px-5'
        } ${selected ? 'bg-primary' : 'border border-line bg-card'} ${
          disabled ? 'opacity-50' : selected ? '' : 'active:bg-card-muted'
        }`}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit={fill}
          minimumFontScale={0.8}
          className={`text-[13px] font-medium ${fill ? 'text-center' : ''} ${
            selected ? 'text-on-primary' : 'text-ink-muted'
          }`}>
          {option.label}
        </Text>
      </Pressable>
    );
  });

  if (fill) {
    return <View className={`flex-row gap-2 ${className}`}>{chips}</View>;
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
