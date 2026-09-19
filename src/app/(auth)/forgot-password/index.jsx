import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';

import { requestPasswordReset } from '@/api/agent-auth';
import { AuthScreen } from '@/components/layout/auth-screen';
import { Button } from '@/components/ui/button';
import { ControlledField } from '@/components/ui/controlled-field';
import { navigateBack, navigateTo } from '@/lib/navigate';
import { toast } from '@/lib/toast';

// Messages are translation keys — ControlledField translates them.
const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'auth.validation.emailRequired')
    .pipe(z.email('auth.validation.emailInvalid')),
});

/**
 * Step 1 of 3 — where to send the code.
 *
 * The server answers 200 whether or not the address has an account, and says
 * so in words ("If an account exists for that email address…"). This screen
 * keeps that property: it advances to the OTP screen either way, so the form
 * cannot be used to discover which emails are registered.
 */
export default function ForgotPasswordScreen() {
  const { t } = useTranslation();

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (data, variables) => {
      toast.success(t('auth.forgotPassword.sentTitle'), t('auth.forgotPassword.sent'));
      navigateTo('/(auth)/reset-otp', {
        email: variables.email,
        // The server states its own expiry (10 minutes today); don't hardcode it.
        expiryMinutes: data?.otpExpiryMinutes != null ? String(data.otpExpiryMinutes) : '',
      });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <AuthScreen
      align="top"
      showBack
      onBackPress={() => navigateBack('/(auth)/login')}
      title={t('auth.forgotPassword.title')}
      subtitle={t('auth.forgotPassword.subtitle')}
      footer={{
        action: t('auth.forgotPassword.backToLogin'),
        onPress: () => navigateBack('/(auth)/login'),
      }}>
      <View className="gap-4">
        <ControlledField
          control={control}
          name="email"
          label={t('auth.forgotPassword.email')}
          placeholder={t('auth.login.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          editable={!isPending}
        />

        <Button
          label={t('auth.forgotPassword.submit')}
          loading={isPending}
          onPress={handleSubmit((values) => mutate({ email: values.email }))}
          className="mt-2"
        />
      </View>
    </AuthScreen>
  );
}
