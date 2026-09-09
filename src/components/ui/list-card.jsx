import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { StatusPill } from '@/components/ui/status-pill';
import { useTheme } from '@/theme/theme-provider';

/**
 * THE row card. Every list in the app is this shape:
 *
 *   [leading]  overline         [status]
 *              title
 *              subtitle
 *              meta
 *              footer           [trailing]
 *
 * Used for customers, accounts, loans, tickets, collections, notifications and
 * the customer profile summary — the only differences are which slots are
 * filled. Add a new list screen by filling slots, not by writing another card.
 *
 * Props:
 *   leading    node before the text (an <Avatar/> or icon), optional
 *   overline   small muted line ABOVE the title (a reference code), optional
 *   title      the bold first line
 *   titleTone  'ink' (default) or 'primary' — collections lead with an amount
 *   subtitle   second line, string or node
 *   meta       third line, string or node
 *   footer     node under the text block (a pill that sits bottom-left)
 *   status     { label, tone } → a <StatusPill/> in the top-right, optional
 *   trailing   'chevron' (default), any node, or null for none
 *   align      'center' (default) or 'start' for the row's cross-axis
 */
const TITLE_TONES = {
  ink: 'text-ink',
  primary: 'text-primary',
};

export function ListCard({
  leading = null,
  overline = null,
  title,
  titleTone = 'ink',
  subtitle = null,
  meta = null,
  footer = null,
  status = null,
  trailing = 'chevron',
  align = 'center',
  onPress,
  className = '',
}) {
  const { shadows, colors } = useTheme();

  const Container = onPress ? Pressable : View;
  const hasRightColumn = Boolean(status) || trailing !== null;

  return (
    <Container
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? title : undefined}
      onPress={onPress}
      style={shadows.sm}
      className={`mb-3 flex-row gap-3 rounded-xl border border-line bg-card p-4 ${
        align === 'start' ? 'items-start' : 'items-center'
      } ${onPress ? 'active:bg-card-muted' : ''} ${className}`}>
      {leading}

      <View className="flex-1">
        {overline ? (
          <Text className="mb-1 text-xs text-ink-muted" numberOfLines={1}>
            {overline}
          </Text>
        ) : null}
        <Text
          className={`text-[15px] font-semibold ${TITLE_TONES[titleTone] ?? TITLE_TONES.ink}`}
          numberOfLines={1}>
          {title}
        </Text>
        {renderLine(subtitle)}
        {renderLine(meta)}
        {footer ? <View className="mt-2 flex-row">{footer}</View> : null}
      </View>

      {hasRightColumn ? (
        <View className="items-end gap-6 pl-1">
          {status ? <StatusPill label={status.label} tone={status.tone} /> : null}
          {trailing === 'chevron' ? (
            <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
          ) : (
            trailing
          )}
        </View>
      ) : null}
    </Container>
  );
}

/** Strings get the standard muted styling; nodes are rendered as given. */
function renderLine(line) {
  if (line === null || line === undefined) return null;
  if (typeof line === 'string') {
    return <Text className="mt-0.5 text-xs text-ink-muted">{line}</Text>;
  }
  return <View className="mt-0.5">{line}</View>;
}
