import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/theme/theme-provider';

/** TextField with a show/hide toggle. */
export const PasswordField = forwardRef(function PasswordField(props, ref) {
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
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          hitSlop={10}
          onPress={() => setVisible((v) => !v)}>
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={19}
            color={colors.inkSoft}
          />
        </Pressable>
      }
      {...props}
    />
  );
});
