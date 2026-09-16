import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/theme-provider';

/**
 * A value the agent will need to read out, type into another system, or send
 * to support — a phone number, an account number, a loan or transaction code.
 *
 * The icon is always visible rather than appearing on press: an affordance
 * nobody can see is one nobody uses.
 *
 * Confirmation is the icon turning into a tick for a moment — no toast. A copy
 * is a small, frequent action; interrupting the screen to announce one is
 * noise, and the agent can already see it worked.
 */
const CONFIRM_MS = 1400;

export function Copyable({ value, label, children, size = 13, className = '' }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const text = value == null ? '' : String(value);
  if (!text) return children ?? null;

  const copy = async () => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), CONFIRM_MS);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.copyValue', { value: label ?? text })}
      accessibilityState={{ selected: copied }}
      hitSlop={8}
      onPress={copy}
      className={`flex-row items-center gap-1.5 ${className}`}>
      {children ?? <Text className="text-xs text-ink-muted">{text}</Text>}
      <Ionicons
        name={copied ? 'checkmark' : 'copy-outline'}
        size={size}
        color={copied ? colors.success : colors.inkSoft}
      />
    </Pressable>
  );
}
