import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { resendActivationOtp, verifyActivationOtp } from '@/api/device-activation';
import { NoGoingBack } from '@/components/layout/no-going-back';
import { SheetScreen } from '@/components/layout/sheet-screen';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { ResendLink } from '@/components/ui/resend-link';
import {
  clearPendingActivation,
  completeActivation,
  getPendingActivation,
  OTP,
  resendSecondsLeft,
  updatePendingActivation,
} from '@/lib/activation';
import { navigateReplace } from '@/lib/navigate';
import { toast } from '@/lib/toast';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/theme/theme-provider';

/**
 * Step 2 of activation — the OTP the server emailed.
 *
 * Everything this screen needs comes from saved progress, never from route
 * params, which is what lets the splash screen drop the user back here after
 * the phone dies. The OTP itself is never saved.
 *
 * The server identifies the pending activation by `agentCode`; `sentTo` is the
 * masked destination it reports (e.g. "***3924"), shown so the agent knows
 * where to look.
 */
export default function VerifyOtpScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { refreshUser } = useAuth();

  const [pending, setPending] = useState(null);
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Load the saved progress. Nothing saved means there is nothing to verify.
  useEffect(() => {
    let cancelled = false;
    getPendingActivation().then((saved) => {
      if (cancelled) return;
      if (saved) setPending(saved);
      else navigateReplace('/(auth)/activate-code');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ticks the resend countdown.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsLeft = resendSecondsLeft(pending?.otpSentAt, now);
  const complete = otp.length === OTP.length;
  const destination = pending?.sentTo;

  const onVerify = async () => {
    if (!complete || submitting || !pending) return;
    setSubmitting(true);
    try {
      await verifyActivationOtp({ agentCode: pending.agentCode, otp });
      // Cleared before leaving, so relaunching after this point goes to login,
      // not back to an OTP that has already been used.
      await completeActivation();
      // completeActivation cleared deviceActivationRequired on disk; pick that
      // up in memory so nothing routes back into activation.
      await refreshUser();
      navigateReplace('/(auth)/code-verified');
    } catch (error) {
      toast.error(error.message);
      setOtp('');
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (secondsLeft > 0 || resending || !pending) return;
    setResending(true);
    try {
      const result = await resendActivationOtp({ agentCode: pending.agentCode });
      const next = {
        sentTo: result?.sentTo ?? pending.sentTo,
        otpSentAt: Date.now(),
      };
      await updatePendingActivation(next);
      setPending((current) => ({ ...current, ...next }));
      setOtp('');
      setNow(Date.now());
      toast.success(
        t('auth.verifyOtp.resentTitle'),
        t('auth.verifyOtp.resent', { destination: next.sentTo ?? '' }),
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResending(false);
    }
  };

  const onUseDifferentCode = async () => {
    await clearPendingActivation();
    navigateReplace('/(auth)/activate-code');
  };

  return (
    <SheetScreen
      header={
        <View>
          <Text className="text-[26px] font-bold text-on-primary">
            {t('auth.verifyOtp.title')}
          </Text>
          <Text className="mt-1.5 text-[14px] leading-5 text-on-primary/85">
            {destination
              ? t('auth.verifyOtp.subtitle', { length: OTP.length, destination })
              : t('auth.verifyOtp.subtitleUnknown', { length: OTP.length })}
          </Text>
        </View>
      }>
      <NoGoingBack />

      {!pending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <Text className="mb-3 text-[15px] font-semibold text-ink">
            {t('auth.verifyOtp.codeLabel')}
          </Text>

          <OtpInput
            value={otp}
            onChange={setOtp}
            length={OTP.length}
            type={OTP.type}
            editable={!submitting}
            autoFocus
          />

          <ResendLink
            className="mt-5"
            prompt={t('auth.verifyOtp.noCode')}
            action={resending ? t('auth.verifyOtp.resending') : t('auth.verifyOtp.resend')}
            countdown={t('auth.verifyOtp.resendIn', { seconds: secondsLeft })}
            secondsLeft={secondsLeft}
            loading={resending}
            onPress={onResend}
          />

          {/* The way out of a resumed activation that the agent no longer wants. */}
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={onUseDifferentCode}
            className="mt-4 self-start">
            <Text className="text-[14px] font-medium text-primary">
              {t('auth.verifyOtp.differentCode')}
            </Text>
          </Pressable>

          {/* Pushes the button to the bottom of the sheet. */}
          <View className="flex-1" />

          <Button
            label={t('auth.verifyOtp.submit')}
            size="lg"
            loading={submitting}
            disabled={!complete}
            onPress={onVerify}
          />
        </>
      )}
    </SheetScreen>
  );
}
