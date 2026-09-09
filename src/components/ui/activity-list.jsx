import { Text, View } from 'react-native';

/**
 * Grouped activity entries in one bordered card. Each entry is
 * { id, title, detail, timestamp } plus an optional `icon` node rendered to the
 * left of the title.
 */
export function ActivityList({ entries }) {
  return (
    <View className="overflow-hidden rounded-xl border border-line bg-card">
      {entries.map((entry, index) => (
        <View
          key={entry.id}
          className={`px-4 py-3.5 ${index < entries.length - 1 ? 'border-b border-line' : ''}`}>
          <View className="flex-row items-center gap-2">
            {entry.icon}
            <Text className="text-[14px] font-semibold text-ink">{entry.title}</Text>
          </View>
          <View className={entry.icon ? 'pl-7' : ''}>
            <Text className="mt-1 text-xs text-ink-muted">{entry.detail}</Text>
            <Text className="mt-1 text-[11px] text-ink-soft">{entry.timestamp}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
