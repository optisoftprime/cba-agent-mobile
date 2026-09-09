import { useWindowDimensions, View } from 'react-native';

/**
 * The torn-paper edge between a receipt's header and its body: a row of
 * background-coloured circles biting into the panel below.
 *
 * `tone` is the tailwind background class of the surface ABOVE the panel - the
 * circles are punched out in that colour.
 */
export function ScallopedEdge({ tone = 'bg-card', radius = 7 }) {
  const { width } = useWindowDimensions();
  const count = Math.ceil(width / (radius * 2)) + 1;

  return (
    <View style={{ height: radius }} className="w-full flex-row">
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            marginTop: -radius,
          }}
          className={tone}
        />
      ))}
    </View>
  );
}
