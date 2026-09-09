import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { SheetScreen } from '@/components/layout/sheet-screen';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/ui/password-field';
import { TextField } from '@/components/ui/text-field';
import { navigateReplace, navigateTo } from '@/lib/navigate';
import { useAuth } from '@/providers/auth-provider';
import { brand } from '@/theme/brand';
import { useTheme } from '@/theme/theme-provider';

// Template placeholder until the device knows who it belongs to. Once someone
// signs in, their real first name replaces this.
const TEMPLATE_NAME = 'John';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { signInWithPassword, signInWithBiometrics, lastUserName } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // No validation while we're converting screens — tapping Login goes straight
  // through. Add the zod schema back with the real endpoint.
  const signIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithPassword({ email, password });
      navigateReplace('/(tabs)');
    } catch (error) {
      Toast.show({ type: 'error', text1: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Uses the real face/fingerprint prompt when there's a kept session to
  // unlock; otherwise it behaves like Login so the template stays clickable.
  const onBiometricPress = async () => {
    const unlocked = await signInWithBiometrics(
      t('auth.login.biometricPrompt', { appName: brand.appName }),
    );
    if (unlocked) {
      navigateReplace('/(tabs)');
      return;
    }
    await signIn();
  };

  return (
    <SheetScreen
      header={
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-[15px] text-on-primary">
              {t('auth.login.greetingNamed', { name: lastUserName ?? TEMPLATE_NAME })}
            </Text>
            <Text className="mt-1.5 text-[26px] font-bold text-on-primary">
              {t('auth.login.title')}
            </Text>
            <Text className="mt-1.5 text-[14px] text-on-primary/85">
              {t('auth.login.subtitle')}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('auth.login.biometric')}
            onPress={onBiometricPress}
            className="h-12 w-12 items-center justify-center rounded-full bg-on-primary/20 active:bg-on-primary/30">
            <Ionicons name="finger-print-outline" size={24} color={colors.onPrimary} />
          </Pressable>
        </View>
      }>
      <View className="gap-5">
        <TextField
          label={t('auth.login.email')}
          placeholder={t('auth.login.emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
        />

        <PasswordField
          label={t('auth.login.password')}
          placeholder={t('auth.login.passwordPlaceholder')}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <Pressable
        accessibilityRole="link"
        hitSlop={8}
        onPress={() => navigateTo('/(auth)/activate-device')}
        className="mt-4 self-end">
        <Text className="text-[15px] font-semibold text-primary">
          {t('auth.login.activateDevice')}
        </Text>
      </Pressable>

      {/* Pushes the button to the bottom of the sheet. */}
      <View className="flex-1" />

      <Button label={t('auth.login.submit')} size="lg" loading={isSubmitting} onPress={signIn} />
    </SheetScreen>
  );
}
