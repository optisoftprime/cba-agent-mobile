import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SheetScreen } from '@/components/layout/sheet-screen';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/ui/password-field';
import { TextField } from '@/components/ui/text-field';
import { isBiometricAvailable } from '@/lib/biometrics';
import { firstNameOf } from '@/lib/format';
import { navigateReplace, navigateTo } from '@/lib/navigate';
import { getUser } from '@/lib/session';
import { toast } from '@/lib/toast';
import { useAuth } from '@/providers/auth-provider';
import { brand } from '@/theme/brand';
import { useTheme } from '@/theme/theme-provider';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { signIn, unlockWithBiometrics } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A fingerprint can unlock a session; it can't create one. So the button
  // only appears when there IS a session to unlock — which also means it
  // disappears the moment a token is found to be no good, since that clears
  // the session. Same test decides whether we can greet them by name.
  const [knownName, setKnownName] = useState(null);
  const [canUnlock, setCanUnlock] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const session = await getUser();
      if (cancelled) return;

      setKnownName(firstNameOf(session?.fullName));
      if (!session) return;

      const available = await isBiometricAvailable();
      if (!cancelled) setCanUnlock(available);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const validate = () => {
    const next = {};
    const trimmed = email.trim();

    if (!trimmed) next.email = t('auth.validation.emailRequired');
    else if (!EMAIL_PATTERN.test(trimmed)) next.email = t('auth.validation.emailInvalid');
    if (!password) next.password = t('auth.validation.passwordRequired');

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /** Where a signed-in agent goes next is the server's call, not ours. */
  const enterApp = (session) => {
    if (session?.deviceActivationRequired) navigateReplace('/(auth)/activate-device');
    else navigateReplace('/(tabs)');
  };

  const onSubmit = async () => {
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    try {
      enterApp(await signIn({ email: email.trim(), password }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onBiometricPress = async () => {
    const unlocked = await unlockWithBiometrics(
      t('auth.login.biometricPrompt', { appName: brand.appName }),
    );
    if (unlocked) navigateReplace('/(tabs)');
  };

  return (
    <SheetScreen
      header={
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-[26px] font-bold text-on-primary">
              {knownName
                ? t('auth.login.titleNamed', { name: knownName })
                : t('auth.login.title')}
            </Text>
            <Text className="mt-1.5 text-[14px] text-on-primary/85">
              {t('auth.login.subtitle')}
            </Text>
          </View>

          {canUnlock ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('auth.login.biometric')}
              onPress={onBiometricPress}
              className="h-12 w-12 items-center justify-center rounded-full bg-on-primary/20 active:bg-on-primary/30">
              <Ionicons name="finger-print-outline" size={24} color={colors.onPrimary} />
            </Pressable>
          ) : null}
        </View>
      }>
      <View className="gap-5">
        <TextField
          label={t('auth.login.email')}
          placeholder={t('auth.login.emailPlaceholder')}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
          }}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          editable={!isSubmitting}
        />

        <PasswordField
          label={t('auth.login.password')}
          placeholder={t('auth.login.passwordPlaceholder')}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
          }}
          error={errors.password}
          editable={!isSubmitting}
          onSubmitEditing={onSubmit}
          returnKeyType="go"
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

      <Button label={t('auth.login.submit')} size="lg" loading={isSubmitting} onPress={onSubmit} />
    </SheetScreen>
  );
}
