import { Text, View } from 'react-native';

/**
 * Grouped label/value rows in a single bordered card — the "Overview" pattern.
 *
 * `rows` is [{ key, label, value, tone }]. `value` may be a string or a node —
 * a node lets a row hold a <StatusPill/>. `tone: 'link'` renders a string value
 * in the brand colour, for values that point at another record.
 */
const TONES = {
  card: { box: 'rounded-2xl border border-line bg-card', divider: 'border-line', label: 'text-ink-muted', value: 'text-ink' },
  /** Rows printed on the brand colour — the deposit receipt. */
  primary: { box: 'bg-primary', divider: 'border-on-primary/20', label: 'text-on-primary/75', value: 'text-on-primary' },
};

export function DetailRows({ rows, tone = 'card', className = '' }) {
  const style = TONES[tone] ?? TONES.card;

  return (
    <View className={`overflow-hidden ${style.box} ${className}`}>
      {rows.map((row, index) => (
        <View
          key={row.key ?? row.label}
          className={`flex-row items-center justify-between gap-4 px-4 py-4 ${
            index < rows.length - 1 ? `border-b ${style.divider}` : ''
          }`}>
          <Text className={`text-[14px] ${style.label}`}>{row.label}</Text>
          {typeof row.value === 'string' || typeof row.value === 'number' ? (
            <Text
              className={`flex-1 text-right text-[14px] font-medium ${
                row.tone === 'link' ? 'text-primary' : style.value
              }`}
              numberOfLines={1}>
              {row.value}
            </Text>
          ) : (
            <View className="flex-1 items-end">{row.value}</View>
          )}
        </View>
      ))}
    </View>
  );
}
