import { View } from 'react-native';

import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

/**
 * The home screen's shape while it loads — same tiles, same panels, same rows,
 * in the same places. Nothing moves when the data arrives.
 */
export function DashboardSkeleton() {
  return (
    <View>
      <View className="-mt-12 gap-3 px-4">
        {[0, 1].map((row) => (
          <View key={row} className="flex-row gap-3">
            {[0, 1].map((column) => (
              <View
                key={column}
                className="flex-1 rounded-2xl border border-line bg-card px-4 py-3.5">
                <Skeleton width="60%" height={12} />
                <Skeleton width="45%" height={22} style={{ marginTop: 10 }} />
              </View>
            ))}
          </View>
        ))}
      </View>

      <View className="mt-7 px-4">
        <View className="rounded-2xl bg-card-muted px-5 py-4">
          <Skeleton width="35%" height={12} />
          <Skeleton width="55%" height={26} style={{ marginTop: 10 }} />
          <Skeleton width="80%" height={12} style={{ marginTop: 12 }} />
        </View>
      </View>

      <View className="mt-7 px-4">
        <Skeleton width="45%" height={16} />
        <View className="mt-3 flex-row gap-3">
          {[0, 1, 2, 3].map((i) => (
            <View key={i} className="flex-1 items-center rounded-xl border border-line bg-card py-3">
              <Skeleton width={22} height={22} radius={11} />
              <Skeleton width="70%" height={9} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      </View>

      <View className="mt-7 px-4">
        <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} lines={4} />
        ))}
      </View>
    </View>
  );
}
