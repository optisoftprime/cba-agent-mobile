import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { requestPasswordReset, verifyPasswordResetOtp } from '@/api/agent-auth';
import { AuthScreen } from '@/components/layout/auth-screen';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { ResendLink } from '@/components/ui/resend-link';
// The same 60s rule as device activation — one place, so the two OTP screens
// cannot drift apart on how often a code may be asked for.
import { resendSecondsLeft } from '@/lib/activation';
import { navigateBack, navigateReplace } from '@/lib/navigate';
import { toast } from '@/lib/toast';

const OTP_LENGTH = 6;

/**
 * Step 2 of 3 — the code from the email, exchanged for a short-lived reset
 * token. This screen never sees a password.
 */
export default function ResetOtpScreen() {
  const { t } = useTranslation();
  const { email, expiryMinutes } = useLocalSearchParams();

  const address = String(email ?? '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(undefined);
  // The code was sent immediately before this screen opened, so the cooldown
  // starts now rather than on the first resend.
  const [otpSentAt, setOtpSentAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsLeft = resendSecondsLeft(otpSentAt, now);

  const verify = useMutation({
    mutationFn: verifyPasswordResetOtp,
    onSuccess: (data) => {
      // Replace, not push: a consumed code must not be re-submittable by
      // walking back into this screen.
      navigateReplace('/(auth)/reset-password', { token: data?.token ?? '', email: address });
    },
    onError: (verifyError) => setError(verifyError.message),
  });

  const resend = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => {
      setOtp('');
      setError(undefined);
      setOtpSentAt(Date.now());
      setNow(Date.now());
      toast.success(t('auth.forgotPassword.sentTitle'), t('auth.resetOtp.resent'));
    },
    onError: (resendError) => toast.error(resendError.message),
  });

  const busy = verify.isPending || resend.isPending;

  const onSubmit = () => {
    if (busy) return;
    if (otp.length < OTP_LENGTH) {
      setError(t('auth.resetOtp.incomplete'));
      return;
    }
    setError(undefined);
    verify.mutate({ email: address, otp });
  };

  return (
    <AuthScreen
      align="top"
      showBack
      onBackPress={() => navigateBack('/(auth)/forgot-password')}
      title={t('auth.resetOtp.title')}
      subtitle={
        expiryMinutes
          ? t('auth.resetOtp.subtitleExpiry', { email: address, minutes: String(expiryMinutes) })
          : t('auth.resetOtp.subtitle', { email: address })
      }
      footer={{
        action: t('auth.forgotPassword.backToLogin'),
        onPress: () => navigateBack('/(auth)/login'),
      }}>
      <View className="gap-4">
        <OtpInput
          value={otp}
          onChange={(next) => {
            setOtp(next);
            if (error) setError(undefined);
          }}
          length={OTP_LENGTH}
          autoFocus
          editable={!busy}
        />

        {error ? <Text className="px-1 text-[13px] text-danger">{error}</Text> : null}

        <Button
          label={t('auth.resetOtp.submit')}
          loading={verify.isPending}
          onPress={onSubmit}
          className="mt-2"
        />

        <ResendLink
          className="justify-center"
          prompt={t('auth.resetOtp.noCode')}
          action={resend.isPending ? t('auth.resetOtp.resending') : t('auth.resetOtp.resend')}
          countdown={t('auth.verifyOtp.resendIn', { seconds: secondsLeft })}
          secondsLeft={secondsLeft}
          loading={resend.isPending}
          onPress={() => !busy && resend.mutate({ email: address })}
        />
      </View>
    </AuthScreen>
  );
}
