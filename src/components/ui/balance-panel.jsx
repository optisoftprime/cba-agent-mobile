import { Text, View } from 'react-native';

/**
 * The dark emphasis panel at the top of a record — a headline figure with a
 * caption above and two footnotes beneath it.
 */
export function BalancePanel({ label, value, footerLeft, footerRight, className = '' }) {
  return (
    <View className={`rounded-2xl bg-panel px-5 py-4 ${className}`}>
      <Text className="text-[13px] text-on-panel/70">{label}</Text>
      <Text className="mt-1.5 text-[28px] font-bold text-on-panel">{value}</Text>

      {footerLeft || footerRight ? (
        <View className="mt-2 flex-row items-center justify-between gap-3">
          <Text className="text-[13px] text-on-panel/70">{footerLeft}</Text>
          <Text className="text-[13px] text-on-panel/70">{footerRight}</Text>
        </View>
      ) : null}
    </View>
  );
}
