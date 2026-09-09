import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { AppHeader, NotificationsAction } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { FilterChips } from '@/components/ui/filter-chips';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { navigateBack } from '@/lib/navigate';
import { useTheme } from '@/theme/theme-provider';

const CATEGORIES = ['account', 'loan', 'deposit', 'app', 'other'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function CreateTicketScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [category, setCategory] = useState(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('high');

  // No validation while we're converting screens — Submit goes straight through.
  const onSubmit = () => {
    Toast.show({ type: 'success', text1: t('support.create.submitted') });
    navigateBack('/(tabs)/support');
  };

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('support.create.title')}
        subtitle={t('support.subtitle')}
        right={<NotificationsAction />}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <View className="gap-5">
            <SelectField
              label={t('support.create.category')}
              placeholder={t('support.create.categoryPlaceholder')}
              value={category}
              onChange={setCategory}
              options={CATEGORIES.map((value) => ({
                value,
                label: t(`support.create.categories.${value}`),
              }))}
            />

            <TextField
              label={t('support.create.subject')}
              placeholder={t('support.create.subjectPlaceholder')}
              value={subject}
              onChangeText={setSubject}
            />

            <TextField
              multiline
              label={t('support.create.description')}
              placeholder={t('support.create.descriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
            />

            <View>
              <Text className="mb-2 text-[15px] font-semibold text-ink">
                {t('support.create.priority')}
              </Text>
              <FilterChips
                fill
                options={PRIORITIES.map((value) => ({
                  value,
                  label: t(`support.create.priorities.${value}`),
                }))}
                value={priority}
                onChange={setPriority}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('support.create.attach')}
              onPress={() => {}}
              className="h-14 flex-row items-center justify-center gap-2 rounded-xl bg-card-muted active:bg-line">
              <Ionicons name="attach-outline" size={20} color={colors.inkSoft} />
              <Text className="text-[15px] text-ink-soft">{t('support.create.attach')}</Text>
            </Pressable>
          </View>

          {/* Pushes the button to the bottom when the form is short. */}
          <View className="min-h-6 flex-1" />

          <Button
            label={t('support.create.submit')}
            icon="send"
            size="lg"
            onPress={onSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
