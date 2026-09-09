import { Text, View } from 'react-native';

/**
 * Small rounded status label. Tones map to the semantic palette, so a re-brand
 * carries them without touching a call site.
 */
const TONES = {
  success: { box: 'bg-success-soft', text: 'text-on-success-soft' },
  warning: { box: 'bg-warning-soft', text: 'text-on-warning-soft' },
  danger: { box: 'bg-danger-soft', text: 'text-on-danger-soft' },
  info: { box: 'bg-info-soft', text: 'text-on-info-soft' },
  neutral: { box: 'bg-card-muted', text: 'text-ink-muted' },
};

export function StatusPill({ label, tone = 'neutral' }) {
  const { box, text } = TONES[tone] ?? TONES.neutral;

  return (
    <View className={`rounded-full px-3 py-1 ${box}`}>
      <Text className={`text-[11px] font-medium ${text}`}>{label}</Text>
    </View>
  );
}
