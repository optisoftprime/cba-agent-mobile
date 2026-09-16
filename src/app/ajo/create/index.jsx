import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AJO_FREQUENCIES, createAjoPlan } from '@/api/ajo';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { DetailRows } from '@/components/ui/detail-rows';
import { FilterChips } from '@/components/ui/filter-chips';
import { SuccessModal } from '@/components/ui/success-modal';
import { TextField } from '@/components/ui/text-field';
import { formatCurrency, formatDate, todayIso } from '@/lib/format';
import { navigateBack, navigateReplace } from '@/lib/navigate';
import { toast } from '@/lib/toast';

/**
 * Step 2 of 2 — the plan itself.
 *
 * The start date uses the platform's own date picker (`ui/date-field`), which
 * speaks plain `YYYY-MM-DD` so no timezone can shift the day.
 */
export default function AjoCreateScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { customerCode, customerName } = useLocalSearchParams();

  const [planName, setPlanName] = useState('');
  const [frequency, setFrequency] = useState('DAILY');
  const [duration, setDuration] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(todayIso);
  const [errors, setErrors] = useState({});
  const [created, setCreated] = useState(null);

  const contributionAmount = Number(amount);
  const durationDays = duration.trim() ? Number(duration) : undefined;

  // What the agent will actually collect, worked out here so they can check it
  // before committing. The server computes its own expectedTotal — this is a
  // preview, not the value that gets sent.
  const expectedTotal =
    Number.isFinite(contributionAmount) && contributionAmount > 0 && durationDays > 0
      ? contributionAmount * durationDays
      : null;

  const { mutate, isPending } = useMutation({
    mutationFn: createAjoPlan,
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ['ajo'] });
      setCreated(plan ?? {});
    },
    onError: (error) => toast.error(error.message),
  });

  const validate = () => {
    const next = {};
    if (!customerCode) next.customer = t('ajo.create.customerRequired');
    if (!planName.trim()) next.planName = t('ajo.create.planNameRequired');
    if (!Number.isFinite(contributionAmount) || contributionAmount < 0.01) {
      next.amount = t('ajo.create.amountRequired');
    }
    // Optional on the server, but a plan with no duration has no expectedTotal
    // and no maturity date, which makes the detail screen meaningless.
    if (duration.trim() && (!Number.isInteger(durationDays) || durationDays < 1)) {
      next.duration = t('ajo.create.durationInvalid');
    }
    if (!startDate) next.startDate = t('ajo.create.startDateRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = () => {
    if (isPending || !validate()) return;
    mutate({
      customerCode: String(customerCode),
      planName: planName.trim(),
      frequency,
      duration: durationDays,
      contributionAmount,
      startDate,
    });
  };

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('ajo.create.title')}
        subtitle={customerName ? String(customerName) : t('ajo.subtitle')}
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
            <DetailRows
              rows={[
                {
                  key: 'customer',
                  label: t('ajo.create.customer'),
                  value: customerName ? String(customerName) : '—',
                },
                {
                  key: 'code',
                  label: t('ajo.create.customerCode'),
                  value: customerCode ? String(customerCode) : '—',
                },
              ]}
            />

            <TextField
              label={t('ajo.create.planName')}
              placeholder={t('ajo.create.planNamePlaceholder')}
              value={planName}
              onChangeText={(value) => {
                setPlanName(value);
                if (errors.planName) setErrors((e) => ({ ...e, planName: undefined }));
              }}
              error={errors.planName}
              editable={!isPending}
            />

            <View>
              <Text className="mb-2 text-[15px] font-semibold text-ink">
                {t('ajo.create.frequency')}
              </Text>
              <FilterChips
                fill
                value={frequency}
                onChange={setFrequency}
                options={AJO_FREQUENCIES.map((value) => ({
                  value,
                  label: t(`ajo.frequencies.${value.toLowerCase()}`),
                }))}
              />
            </View>

            <TextField
              label={t('ajo.create.amount')}
              placeholder={t('ajo.create.amountPlaceholder')}
              keyboardType="numeric"
              value={amount}
              onChangeText={(value) => {
                setAmount(value.replace(/[^0-9.]/g, ''));
                if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
              }}
              error={errors.amount}
              editable={!isPending}
            />

            <TextField
              label={t('ajo.create.duration')}
              placeholder={t('ajo.create.durationPlaceholder')}
              keyboardType="number-pad"
              value={duration}
              onChangeText={(value) => {
                setDuration(value.replace(/[^0-9]/g, ''));
                if (errors.duration) setErrors((e) => ({ ...e, duration: undefined }));
              }}
              error={errors.duration}
              editable={!isPending}
            />

            <DateField
              label={t('ajo.create.startDate')}
              placeholder={t('ajo.create.startDatePlaceholder')}
              value={startDate}
              onChange={setStartDate}
              error={errors.startDate}
              doneLabel={t('common.done')}
              // A plan cannot be backdated — the first contribution is collected
              // on or after the day it starts.
              minimumDate={new Date()}
            />

            {expectedTotal ? (
              <DetailRows
                rows={[
                  {
                    key: 'expected',
                    label: t('ajo.create.expectedTotal'),
                    value: formatCurrency(expectedTotal),
                    tone: 'primary',
                  },
                ]}
              />
            ) : null}

            {errors.customer ? (
              <Text className="text-[13px] text-danger">{errors.customer}</Text>
            ) : null}
          </View>

          <View className="min-h-6 flex-1" />

          <Button
            label={t('ajo.create.submit')}
            size="lg"
            loading={isPending}
            onPress={onSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={created !== null}
        title={t('ajo.create.success.title')}
        message={t('ajo.create.success.message')}
        details={[
          created?.reference && {
            key: 'reference',
            label: t('ajo.create.success.reference'),
            value: created.reference,
          },
          created?.customerName && {
            key: 'customer',
            label: t('ajo.create.customer'),
            value: created.customerName,
          },
          created?.expectedTotal != null && {
            key: 'expected',
            label: t('ajo.create.expectedTotal'),
            value: formatCurrency(created.expectedTotal),
          },
          created?.maturityDate && {
            key: 'maturity',
            label: t('ajo.create.success.maturity'),
            value: formatDate(created.maturityDate),
          },
        ].filter(Boolean)}
        primaryLabel={
          created?.reference ? t('ajo.create.success.view') : t('ajo.create.success.done')
        }
        onPrimary={() => {
          const reference = created?.reference;
          setCreated(null);
          // Replace, not push: the filled-in form must not survive underneath,
          // where walking back into it would create the plan a second time.
          if (reference) navigateReplace(`/ajo/${encodeURIComponent(reference)}`);
          else navigateBack('/ajo');
        }}
        secondaryLabel={created?.reference ? t('ajo.create.success.done') : undefined}
        onSecondary={() => {
          setCreated(null);
          navigateBack('/ajo');
        }}
      />
    </View>
  );
}
