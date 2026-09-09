import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { forgotPasswordRequest } from '@/api/auth';
import { AuthScreen } from '@/components/layout/auth-screen';
import { Button } from '@/components/ui/button';
import { ControlledField } from '@/components/ui/controlled-field';
import { navigateBack } from '@/lib/navigate';

// Messages are translation keys — ControlledField translates them.
const schema = z.object({
  email: z
    .string()
    .min(1, 'auth.validation.emailRequired')
    .pipe(z.email('auth.validation.emailInvalid')),
});

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: forgotPasswordRequest,
    // Deliberately the same message whether or not the email exists, so this
    // cannot be used to discover which addresses are registered.
    onSuccess: () => {
      Toast.show({ type: 'success', text1: t('auth.forgotPassword.sent') });
      navigateBack('/(auth)/login');
    },
    onError: (error) => Toast.show({ type: 'error', text1: error.message }),
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
        />

        <Button
          label={t('auth.forgotPassword.submit')}
          loading={isPending}
          onPress={handleSubmit((values) => mutate(values))}
          className="mt-2"
        />
      </View>
    </AuthScreen>
  );
}
