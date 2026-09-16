import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/theme/theme-provider';

/** TextField with a show/hide toggle. */
export const PasswordField = forwardRef(function PasswordField(props, ref) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      ref={ref}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
      right={
        <Pressable
          accessibilityRole="button"
          // The label says what the tap DOES; the icon says what the field IS.
          accessibilityLabel={visible ? t('common.hidePassword') : t('common.showPassword')}
          hitSlop={10}
          onPress={() => setVisible((v) => !v)}>
          <Ionicons
            // Open eye while the password is readable, crossed while it is
            // hidden — the icon reflects the field's current state, so it
            // matches what the agent can actually see.
            name={visible ? 'eye-outline' : 'eye-off-outline'}
            size={19}
            color={colors.inkSoft}
          />
        </Pressable>
      }
      {...props}
    />
  );
});
