import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { activateDevice } from '@/api/device-activation';
import { SheetScreen } from '@/components/layout/sheet-screen';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { TextField } from '@/components/ui/text-field';
import { ACTIVATION_CODE, savePendingActivation } from '@/lib/activation';
import { getDeviceInfo } from '@/lib/device';
import { navigateReplace } from '@/lib/navigate';
import { toast } from '@/lib/toast';

/**
 * Step 1 of activation. The agent types the two things their admin issued —
 * the agent code and the activation code. Everything else the server needs
 * (device id, name, platform, app version) is collected for them.
 */
export default function ActivateCodeScreen() {
  const { t } = useTranslation();

  const [agentCode, setAgentCode] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const complete = agentCode.trim().length > 0 && code.length === ACTIVATION_CODE.length;

  const onSubmit = async () => {
    if (!complete || submitting) return;

    setSubmitting(true);
    try {
      const device = await getDeviceInfo();
      const trimmedAgentCode = agentCode.trim();
      const result = await activateDevice({
        agentCode: trimmedAgentCode,
        activationCode: code,
        ...device,
      });

      // Saved before navigating: from here on the OTP screen is resumable, so
      // the phone dying doesn't strand a code that has already been sent.
      // The agent code is what resend and verify are keyed by; fall back to
      // what was typed if the server doesn't echo it.
      await savePendingActivation({
        agentCode: result?.agentCode ?? trimmedAgentCode,
        sentTo: result?.sentTo,
      });
      navigateReplace('/(auth)/verify-otp');
    } catch (error) {
      toast.error(error.message);
      setCode('');
      setSubmitting(false);
    }
  };

  return (
    <SheetScreen
      showBack
      header={
        <View>
          <Text className="text-[26px] font-bold text-on-primary">
            {t('auth.activateCode.title')}
          </Text>
          <Text className="mt-1.5 text-[14px] leading-5 text-on-primary/85">
            {t('auth.activateCode.subtitle')}
          </Text>
        </View>
      }>
      <TextField
        label={t('auth.activateCode.agentCodeLabel')}
        placeholder={t('auth.activateCode.agentCodePlaceholder')}
        value={agentCode}
        onChangeText={setAgentCode}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!submitting}
      />

      <Text className="mb-3 mt-6 text-[15px] font-semibold text-ink">
        {t('auth.activateCode.codeLabel')}
      </Text>

      <OtpInput
        value={code}
        onChange={setCode}
        length={ACTIVATION_CODE.length}
        type={ACTIVATION_CODE.type}
        editable={!submitting}
      />

      <Text className="mt-5 text-[14px] leading-5 text-ink-muted">
        {t('auth.activateCode.noCode')}
      </Text>

      {/* Pushes the button to the bottom of the sheet. */}
      <View className="flex-1" />

      <Button
        label={t('auth.activateCode.submit')}
        size="lg"
        loading={submitting}
        disabled={!complete}
        onPress={onSubmit}
      />
    </SheetScreen>
  );
}
