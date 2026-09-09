import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { TextField } from '@/components/ui/text-field';

/**
 * Binds a field component to react-hook-form.
 *
 * Zod schemas store TRANSLATION KEYS as their messages, so the error is
 * translated here and validation copy stays in the locale files.
 */
export function ControlledField({ control, name, component: Field = TextField, ...props }) {
  const { t } = useTranslation();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <Field
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message ? t(error.message) : undefined}
          {...props}
        />
      )}
    />
  );
}
