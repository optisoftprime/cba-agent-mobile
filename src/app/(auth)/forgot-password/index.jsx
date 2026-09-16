import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';

import { AuthScreen } from '@/components/layout/auth-screen';
import { Button } from '@/components/ui/button';
import { ControlledField } from '@/components/ui/controlled-field';
import { navigateBack } from '@/lib/navigate';
import { toast } from '@/lib/toast';

// Messages are translation keys — ControlledField translates them.
const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'auth.validation.emailRequired')
    .pipe(z.email('auth.validation.emailInvalid')),
});

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  // TODO(backend): ezone-agent-service has no password-reset endpoint yet, so
  // this confirms locally. When it exists, call it here — and keep the same
  // message whether or not the email is registered, so the form can't be used
  // to discover which addresses have accounts.
  const onSubmit = () => {
    toast.success(t('auth.forgotPassword.sentTitle'), t('auth.forgotPassword.sent'));
    navigateBack('/(auth)/login');
  };

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
          onPress={handleSubmit(onSubmit)}
          className="mt-2"
        />
      </View>
    </AuthScreen>
  );
}
