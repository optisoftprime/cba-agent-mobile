import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SheetScreen } from '@/components/layout/sheet-screen';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { navigateTo } from '@/lib/navigate';

export default function ActivateCodeScreen() {
  const { t } = useTranslation();
  const [code, setCode] = useState('');

  return (
    <SheetScreen
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
      <Text className="mb-3 text-[15px] font-semibold text-ink">
        {t('auth.activateCode.codeLabel')}
      </Text>

      <OtpInput value={code} onChange={setCode} autoFocus />

      <Text className="mt-5 text-[14px] leading-5 text-ink-muted">
        {t('auth.activateCode.noCode')}
      </Text>

      {/* Pushes the button to the bottom of the sheet. */}
      <View className="flex-1" />

      <Button
        label={t('auth.activateCode.submit')}
        size="lg"
        onPress={() => navigateTo('/(auth)/code-verified')}
      />
    </SheetScreen>
  );
}
