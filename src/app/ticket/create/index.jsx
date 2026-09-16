import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { createTicket, ticketCategoriesQuery, TICKET_PRIORITIES } from '@/api/support';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { FilterChips } from '@/components/ui/filter-chips';
import { SelectField } from '@/components/ui/select-field';
import { SuccessModal } from '@/components/ui/success-modal';
import { TextField } from '@/components/ui/text-field';
import { navigateBack, navigateReplace } from '@/lib/navigate';
import { toast } from '@/lib/toast';
import { useTheme } from '@/theme/theme-provider';

export default function CreateTicketScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const categories = useQuery(ticketCategoriesQuery);

  const [categoryId, setCategoryId] = useState(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [errors, setErrors] = useState({});
  // The created ticket, held so the success modal can read back what the
  // server assigned — the number is the thing the agent has to keep.
  const [created, setCreated] = useState(null);

  const { mutate, isPending } = useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket) => {
      // The list carries the Open/In Progress/Resolved counts, so it has to be
      // refetched, not just appended to.
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      // Raising a ticket is a finished operation, so it ends in the success
      // modal, not a toast that would take the ticket number with it.
      setCreated(ticket ?? {});
    },
    onError: (error) => toast.error(error.message),
  });

  // Only `subject` is required by the server, but a ticket with no detail
  // wastes a support round-trip, so the form asks for a category too.
  const validate = () => {
    const next = {};
    if (!subject.trim()) next.subject = t('support.create.subjectRequired');
    if (categoryId == null) next.category = t('support.create.categoryRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = () => {
    if (isPending || !validate()) return;
    mutate({
      subject: subject.trim(),
      description: description.trim(),
      categoryId,
      priority,
    });
  };

  return (
    <View className="flex-1 bg-background">
      <AppHeader showBack title={t('support.create.title')} subtitle={t('support.subtitle')} />

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
              placeholder={
                categories.isPending
                  ? t('support.create.categoriesLoading')
                  : t('support.create.categoryPlaceholder')
              }
              value={categoryId}
              onChange={(value) => {
                setCategoryId(value);
                if (errors.category) setErrors((e) => ({ ...e, category: undefined }));
              }}
              error={errors.category ?? (categories.isError ? categories.error?.message : undefined)}
              options={(categories.data ?? []).map((category) => ({
                value: category.id,
                label: category.name,
              }))}
            />

            <TextField
              label={t('support.create.subject')}
              placeholder={t('support.create.subjectPlaceholder')}
              value={subject}
              onChangeText={(value) => {
                setSubject(value);
                if (errors.subject) setErrors((e) => ({ ...e, subject: undefined }));
              }}
              error={errors.subject}
              editable={!isPending}
            />

            <TextField
              multiline
              label={t('support.create.description')}
              placeholder={t('support.create.descriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
              editable={!isPending}
            />

            <View>
              <Text className="mb-2 text-[15px] font-semibold text-ink">
                {t('support.create.priority')}
              </Text>
              <FilterChips
                fill
                value={priority}
                onChange={setPriority}
                options={TICKET_PRIORITIES.map((value) => ({
                  value,
                  label: t(`support.create.priorities.${value.toLowerCase()}`),
                }))}
              />
            </View>

            {/* TODO(backend): the API takes an imageUrl, so an attachment needs
                an upload endpoint first — there isn't one in the spec. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('support.create.attach')}
              disabled
              className="h-14 flex-row items-center justify-center gap-2 rounded-xl bg-card-muted opacity-60">
              <Ionicons name="attach-outline" size={20} color={colors.inkSoft} />
              <Text className="text-[15px] text-ink-soft">{t('support.create.attachSoon')}</Text>
            </Pressable>
          </View>

          {/* Pushes the button to the bottom when the form is short. */}
          <View className="min-h-6 flex-1" />

          <Button
            label={t('support.create.submit')}
            icon="send"
            size="lg"
            loading={isPending}
            onPress={onSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={created !== null}
        title={t('support.create.success.title')}
        message={t('support.create.success.message')}
        details={[
          created?.ticketNumber && {
            key: 'reference',
            label: t('support.create.success.reference'),
            value: created.ticketNumber,
          },
          created?.status && {
            key: 'status',
            label: t('support.create.success.status'),
            value: created.status,
          },
          created?.priority && {
            key: 'priority',
            label: t('support.create.success.priority'),
            value: created.priority,
          },
        ].filter(Boolean)}
        primaryLabel={
          created?.ticketNumber
            ? t('support.create.success.view')
            : t('support.create.success.done')
        }
        onPrimary={() => {
          const ticketNumber = created?.ticketNumber;
          setCreated(null);
          // Replace, not push: the filled-in form must not sit under the ticket
          // waiting to be walked back into and submitted twice.
          if (ticketNumber) navigateReplace(`/ticket/${encodeURIComponent(ticketNumber)}`);
          else navigateBack('/(tabs)/support');
        }}
        secondaryLabel={created?.ticketNumber ? t('support.create.success.done') : undefined}
        onSecondary={() => {
          setCreated(null);
          navigateBack('/(tabs)/support');
        }}
      />
    </View>
  );
}
