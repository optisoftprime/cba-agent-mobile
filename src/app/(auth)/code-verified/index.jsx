import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { MessageScreen } from '@/components/layout/message-screen';
import { navigateReplace } from '@/lib/navigate';
import { useTheme } from '@/theme/theme-provider';

export default function CodeVerifiedScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <MessageScreen
      // The scalloped success badge in the design; Ionicons has no equivalent,
      // and this ships in the same @expo/vector-icons package.
      icon={<MaterialCommunityIcons name="check-decagram" size={64} color={colors.success} />}
      title={t('auth.codeVerified.title')}
      message={t('auth.codeVerified.message')}
      actionLabel={t('auth.codeVerified.action')}
      onAction={() => navigateReplace('/(auth)/login')}
    />
  );
}
