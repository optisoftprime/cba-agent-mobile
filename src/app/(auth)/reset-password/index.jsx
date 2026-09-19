import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { confirmPasswordReset } from '@/api/agent-auth';
import { AuthScreen } from '@/components/layout/auth-screen';
import { NoGoingBack } from '@/components/layout/no-going-back';
import { Button } from '@/components/ui/button';
import { ControlledField } from '@/components/ui/controlled-field';
import { PasswordField } from '@/components/ui/password-field';
import { SuccessModal } from '@/components/ui/success-modal';
import { navigateReset } from '@/lib/navigate';
import { newPasswordFields } from '@/lib/password';
import { toast } from '@/lib/toast';

const schema = newPasswordFields();

/**
 * Step 3 of 3 — set the new password with the token from the OTP step.
 *
 * The token is single-use and short-lived, so this screen ENDS the reset:
 * `NoGoingBack` stops the agent walking back into the consumed OTP screen, and
 * finishing resets to login rather than popping.
 */
export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams();

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmNewPassword: '' },
  });

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: confirmPasswordReset,
    onError: (error) => toast.error(error.message),
  });

  const toLogin = () => navigateReset('/(auth)/login');

  return (
    <AuthScreen
      align="top"
      title={t('auth.resetPassword.title')}
      subtitle={t('auth.resetPassword.subtitle')}>
      {/* The reset token has been spent — back must not return to the OTP. */}
      <NoGoingBack onBack={toLogin} />

      <View className="gap-4">
        <ControlledField
          control={control}
          name="newPassword"
          component={PasswordField}
          label={t('auth.resetPassword.newPassword')}
          placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
          textContentType="newPassword"
          editable={!isPending}
        />

        <ControlledField
          control={control}
          name="confirmNewPassword"
          component={PasswordField}
          label={t('auth.resetPassword.confirmPassword')}
          placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
          textContentType="newPassword"
          editable={!isPending}
        />

        <Button
          label={t('auth.resetPassword.submit')}
          loading={isPending}
          className="mt-2"
          onPress={handleSubmit((values) =>
            mutate({
              token: String(token ?? ''),
              newPassword: values.newPassword,
              confirmNewPassword: values.confirmNewPassword,
            }),
          )}
        />
      </View>

      <SuccessModal
        visible={isSuccess}
        title={t('auth.resetPassword.success.title')}
        message={t('auth.resetPassword.success.message')}
        primaryLabel={t('auth.resetPassword.success.signIn')}
        onPrimary={toLogin}
      />
    </AuthScreen>
  );
}
