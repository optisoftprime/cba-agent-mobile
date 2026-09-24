import { Pressable, Text, View } from 'react-native';

/**
 * Grouped activity entries in one bordered card. Each entry is
 * { id, title, detail, timestamp } plus an optional `icon` node rendered to the
 * left of the title.
 *
 * An entry with `onPress` becomes tappable — three lines cannot carry a whole
 * movement, so the row opens the rest rather than quietly dropping it.
 */
export function ActivityList({ entries }) {
  return (
    <View className="overflow-hidden rounded-xl border border-line bg-card">
      {entries.map((entry, index) => {
        const Row = entry.onPress ? Pressable : View;

        return (
          <Row
            key={entry.id}
            accessibilityRole={entry.onPress ? 'button' : undefined}
            onPress={entry.onPress}
            className={`px-4 py-3.5 ${index < entries.length - 1 ? 'border-b border-line' : ''} ${
              entry.onPress ? 'active:bg-card-muted' : ''
            }`}
          >
            <View className="flex-row items-center gap-2">
              {entry.icon}
              <Text className="text-[14px] font-semibold text-ink">{entry.title}</Text>
            </View>
            <View className={entry.icon ? 'pl-7' : ''}>
              <Text className="mt-1 text-xs text-ink-muted">{entry.detail}</Text>
              <Text className="mt-1 text-[11px] text-ink-soft">{entry.timestamp}</Text>
            </View>
          </Row>
        );
      })}
    </View>
  );
}
