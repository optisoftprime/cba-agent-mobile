import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { z } from 'zod';

import { changePassword } from '@/api/agent-auth';
import { AppHeader } from '@/components/layout/app-header';
import { KeyboardView } from '@/components/layout/keyboard-view';
import { Button } from '@/components/ui/button';
import { ControlledField } from '@/components/ui/controlled-field';
import { PasswordField } from '@/components/ui/password-field';
import { SuccessModal } from '@/components/ui/success-modal';
import { navigateBack } from '@/lib/navigate';
import { newPasswordFields, PASSWORD_MIN_LENGTH } from '@/lib/password';
import { toast } from '@/lib/toast';

const schema = newPasswordFields({
  oldPassword: z.string().min(1, 'auth.validation.currentPasswordRequired'),
});

/** Change the password of the agent who is already signed in. */
export default function ChangePasswordScreen() {
  const { t } = useTranslation();

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { oldPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: changePassword,
    // Clear the boxes: the old password is now worthless and the new one
    // should not be left sitting readable on screen behind the modal.
    onSuccess: () => reset({ oldPassword: '', newPassword: '', confirmNewPassword: '' }),
    onError: (error) => toast.error(error.message),
  });

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('auth.changePassword.title')}
        subtitle={t('auth.changePassword.subtitle')}
      />

      <KeyboardView>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            <ControlledField
              control={control}
              name="oldPassword"
              component={PasswordField}
              label={t('auth.changePassword.currentPassword')}
              placeholder={t('auth.changePassword.currentPasswordPlaceholder')}
              textContentType="password"
              editable={!isPending}
            />

            <ControlledField
              control={control}
              name="newPassword"
              component={PasswordField}
              label={t('auth.changePassword.newPassword')}
              placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
              textContentType="newPassword"
              editable={!isPending}
            />

            <ControlledField
              control={control}
              name="confirmNewPassword"
              component={PasswordField}
              label={t('auth.changePassword.confirmPassword')}
              placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
              textContentType="newPassword"
              editable={!isPending}
            />

            {/* The bank's rule, stated up front rather than discovered through
                a rejection. */}
            <Text className="px-1 text-[13px] leading-5 text-ink-muted">
              {t('auth.changePassword.rule', { min: PASSWORD_MIN_LENGTH })}
            </Text>
          </View>

          <View className="min-h-6 flex-1" />

          <Button
            label={t('auth.changePassword.submit')}
            size="lg"
            loading={isPending}
            onPress={handleSubmit((values) => mutate(values))}
          />
        </ScrollView>
      </KeyboardView>

      <SuccessModal
        visible={isSuccess}
        title={t('auth.changePassword.success.title')}
        message={t('auth.changePassword.success.message')}
        primaryLabel={t('auth.changePassword.success.done')}
        onPrimary={() => navigateBack('/profile')}
      />
    </View>
  );
}
