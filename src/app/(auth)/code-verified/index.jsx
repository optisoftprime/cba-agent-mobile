import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { MessageScreen } from '@/components/layout/message-screen';
import { NoGoingBack } from '@/components/layout/no-going-back';
import { navigateReset } from '@/lib/navigate';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/theme/theme-provider';

/**
 * The end of activation. There is deliberately no way back: the OTP behind
 * this screen has been spent, and the activation code before it with it.
 */
export default function CodeVerifiedScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();

  // The only way out of this screen, wherever it is triggered from.
  const leave = () => navigateReset(isAuthenticated ? '/(tabs)' : '/(auth)/login');

  return (
    <>
      <NoGoingBack onBack={leave} />

      <MessageScreen
        // The scalloped success badge in the design; Ionicons has no
        // equivalent, and this ships in the same @expo/vector-icons package.
        icon={<MaterialCommunityIcons name="check-decagram" size={64} color={colors.success} />}
        title={t('auth.codeVerified.title')}
        message={t('auth.codeVerified.message')}
        actionLabel={t('auth.codeVerified.action')}
        // navigateReset, not replace: the activation screens behind this one
        // are finished business and must not be one back press away.
        onAction={leave}
      />
    </>
  );
}
