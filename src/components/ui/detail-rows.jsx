import { Text, View } from 'react-native';

import { Copyable } from '@/components/ui/copyable';

/**
 * Grouped label/value rows in a single bordered card — the "Overview" pattern.
 *
 * `rows` is [{ key, label, value, tone, copyable }]. `value` may be a string or
 * a node — a node lets a row hold a <StatusPill/>. `tone: 'link'` renders a
 * string value in the brand colour, for values that point at another record.
 * `copyable: true` adds a copy button — for anything the agent has to read out
 * or retype elsewhere (phone, account number, transaction reference).
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
          {/* The label keeps its width; the value takes the rest and shrinks
              into it. Without shrink, a long value (a reference UUID) rendered
              at its full content width and ran back over the label. */}
          <Text className={`shrink-0 text-[14px] ${style.label}`} numberOfLines={1}>
            {row.label}
          </Text>
          {typeof row.value === 'string' || typeof row.value === 'number' ? (
            (() => {
              const text = (
                <Text
                  className={`shrink text-[14px] font-medium ${
                    row.tone === 'link' ? 'text-primary' : style.value
                  }`}
                  numberOfLines={1}>
                  {row.value}
                </Text>
              );

              return row.copyable ? (
                <View className="flex-1 flex-row items-center justify-end">
                  <Copyable value={row.value} label={row.label} className="shrink">
                    {text}
                  </Copyable>
                </View>
              ) : (
                <View className="flex-1 flex-row justify-end">{text}</View>
              );
            })()
          ) : (
            <View className="flex-1 items-end">{row.value}</View>
          )}
        </View>
      ))}
    </View>
  );
}
