import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { customerAccountsQuery } from '@/api/customers';
import { Permission } from '@/api/permissions';
import { PndBadge } from '@/components/customers/pnd-notice';
import { AppHeader } from '@/components/layout/app-header';
import { LockedScreen } from '@/components/layout/locked-screen';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ListCard } from '@/components/ui/list-card';
import { SkeletonCard } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import { ACCOUNT_STATUS_TONE } from '@/lib/status';
import { usePermission, useRefreshWithPermissions } from '@/providers/permission-provider';

const isPnd = (account) => String(account?.pndStatus ?? '').toLowerCase() === 'yes';
const PND_REASON_KEY = {
  MANUAL: 'customers.detail.pnd.reasonManual',
  TIER_BREACH: 'customers.detail.pnd.reasonTierBreach',
};

/** Step 2 of 4 — which of the customer's accounts receives it. */
export default function DepositAccountScreen() {
  const { t } = useTranslation();
  const access = usePermission(Permission.deposit);
  const { customerCode, customerName } = useLocalSearchParams();

  const code = String(customerCode ?? '');
  const { data, isPending, isError, error, refetch, isRefetching } = useQuery(
    customerAccountsQuery(code),
  );

  const onRefresh = useRefreshWithPermissions(refetch);

  // The account tapped that is on PND, held until the agent acknowledges it.
  const [pndAccount, setPndAccount] = useState(null);

  const accounts = data ?? [];

  const goToAmount = (account) =>
    navigateTo('/deposit/amount', {
      customerCode: code,
      customerName: customerName ?? '',
      accountNumber: account.accountNumber,
      accountName: account.accountName,
    });

  // A PND account stops the agent for a warning first — the account is
  // restricted, and they should know before transacting. The deposit is still
  // allowed (PND blocks debits, and this is a credit), so the dialog explains
  // and lets them continue rather than blocking a valid deposit.
  const onPick = (account) => (isPnd(account) ? setPndAccount(account) : goToAmount(account));

  const pndReasonKey = PND_REASON_KEY[String(pndAccount?.pndReason ?? '').toUpperCase()];

  if (!access.allowed) {
    return <LockedScreen showBack title={t('deposit.account.title')} code={Permission.deposit} />;
  }

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('deposit.account.title')}
        subtitle={customerName ? String(customerName) : t('deposit.account.subtitle')}
      />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={isPending ? [] : accounts}
          keyExtractor={(account) => account.accountNumber}
          renderItem={({ item }) => (
            <ListCard
              title={item.accountName}
              subtitle={item.accountNumber}
              meta={
                <Text className="text-xs text-ink-muted">
                  {t('deposit.account.currentBalance')}{' '}
                  <Text className="font-semibold text-primary">
                    {formatCurrency(item.currentBalance ?? 0)}
                  </Text>
                </Text>
              }
              status={
                item.status
                  ? {
                      label: item.status,
                      tone: ACCOUNT_STATUS_TONE[String(item.status).toLowerCase()] ?? 'neutral',
                    }
                  : null
              }
              footer={<PndBadge account={item} />}
              onPress={() => onPick(item)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={onRefresh}
          ListEmptyComponent={
            isPending ? (
              <View>
                {[0, 1, 2].map((i) => (
                  <SkeletonCard key={i} lines={3} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="wallet-outline"
                title={t('deposit.account.empty.title')}
                message={t('deposit.account.empty.message')}
              />
            )
          }
        />
      )}

      <ConfirmDialog
        visible={pndAccount !== null}
        icon="lock-closed-outline"
        title={t('deposit.account.pnd.title')}
        message={
          t('deposit.account.pnd.message') +
          (pndReasonKey ? `\n\n${t(pndReasonKey)}` : '')
        }
        confirmLabel={t('deposit.account.pnd.confirm')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setPndAccount(null)}
        onConfirm={() => {
          const account = pndAccount;
          setPndAccount(null);
          goToAmount(account);
        }}
      />
    </View>
  );
}
