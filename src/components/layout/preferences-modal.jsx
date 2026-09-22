import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LANGUAGES, setAppLanguage } from '@/i18n';
import { load, save, StorageKeys } from '@/lib/storage';
import { useTheme } from '@/theme/theme-provider';

const THEME_OPTIONS = [
  { value: 'light', icon: 'sunny-outline' },
  { value: 'dark', icon: 'moon-outline' },
  { value: 'system', icon: 'phone-portrait-outline' },
];

/**
 * Theme + language, in one card.
 *
 * Every choice applies the moment it is tapped — the card itself re-colours and
 * re-words — so the agent sees what they picked rather than reading a label
 * about it. Both are saved by their own setters (`setMode`, `setAppLanguage`),
 * so there is nothing to "save" on close.
 *
 * Styled from `colors`, not classes: a Modal renders into its own host tree,
 * which the theme's CSS variables do not reach (same as `ui/success-modal`).
 * Pressables take a plain style OBJECT — NativeWind wraps Pressable, and a
 * `style={({ pressed }) => …}` function gets dropped, leaving an unstyled row.
 */
export function PreferencesModal({ visible, onClose }) {
  const { t, i18n } = useTranslation();
  const { colors, mode, setMode } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#00000066',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
        }}>
        <View
          style={{
            width: '100%',
            maxWidth: 520,
            maxHeight: '88%',
            backgroundColor: colors.card,
            borderRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 26,
            paddingBottom: 20,
          }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 19, fontWeight: '700', color: colors.ink, textAlign: 'center' }}>
              {t('preferences.title')}
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                lineHeight: 21,
                color: colors.inkMuted,
                textAlign: 'center',
              }}>
              {t('preferences.message')}
            </Text>

            <GroupLabel colors={colors}>{t('preferences.theme')}</GroupLabel>
            {THEME_OPTIONS.map((option) => (
              <OptionRow
                key={option.value}
                colors={colors}
                icon={option.icon}
                label={t(`preferences.themes.${option.value}`)}
                selected={mode === option.value}
                onPress={() => setMode(option.value)}
              />
            ))}

            <GroupLabel colors={colors}>{t('preferences.language')}</GroupLabel>
            {LANGUAGES.map((language) => (
              <OptionRow
                key={language.code}
                colors={colors}
                icon="language-outline"
                label={language.label}
                selected={i18n.language === language.code}
                onPress={() => setAppLanguage(language.code)}
              />
            ))}

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="active:opacity-80"
              style={{
                marginTop: 22,
                height: 52,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
              }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.onPrimary }}>
                {t('preferences.done')}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/**
 * The first-launch prompt: shows `PreferencesModal` once, on a fresh install,
 * and never again after the agent confirms. Mounted on the login screen —
 * the first screen a fresh install can act on (the splash never asks).
 *
 * The flag is plain storage and survives sign-out, like the theme and language
 * themselves: they belong to the handset, not the agent.
 */
export function FirstLaunchPreferences() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    load(StorageKeys.preferencesChosen).then((chosen) => {
      if (!cancelled && !chosen) setVisible(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onClose = () => {
    setVisible(false);
    save(StorageKeys.preferencesChosen, true);
  };

  return <PreferencesModal visible={visible} onClose={onClose} />;
}

function GroupLabel({ colors, children }) {
  return (
    <Text
      style={{
        marginTop: 22,
        marginBottom: 8,
        fontSize: 13,
        fontWeight: '600',
        color: colors.inkMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
      {children}
    </Text>
  );
}

function OptionRow({ colors, icon, label, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="active:opacity-80"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.line,
        backgroundColor: selected ? colors.primaryLight : colors.background,
      }}>
      <Ionicons name={icon} size={20} color={selected ? colors.primary : colors.ink} />
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: colors.ink }}>{label}</Text>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? colors.primary : colors.inkMuted}
      />
    </Pressable>
  );
}
