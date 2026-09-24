import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { BrandLogo } from '@/components/ui/brand-logo';
import { Button } from '@/components/ui/button';
import { DetailRows } from '@/components/ui/detail-rows';
import { ScallopedEdge } from '@/components/ui/scalloped-edge';
import { formatCurrencyPrecise, formatDateTime, maskAccount } from '@/lib/format';
import { agentView } from '@/lib/agent';
import { buildReceiptHtml, logoDataUri, shareReceiptPdf } from '@/lib/receipt-pdf';
import { toast } from '@/lib/toast';
import { useAuth } from '@/providers/auth-provider';
import { brand } from '@/theme/brand';
import { useTheme } from '@/theme/theme-provider';

/**
 * The receipt, built entirely from what the server returned.
 *
 * TODO(backend): there is no `GET /agent/deposits/{reference}`, so this can
 * only be reached straight after posting — a receipt cannot be reopened later
 * from the collections history or after the app restarts.
 */
export default function DepositReceiptScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const agent = agentView(useAuth().user);
  const {
    customerName,
    accountNumber,
    amount,
    status,
    transactionId,
    capturedAt,
    customerBalanceAfter,
  } = useLocalSearchParams();

  const posted = String(status ?? '').toUpperCase() === 'POSTED';
  const maskedAccount = maskAccount(String(accountNumber ?? ''));
  const depositedAmount = formatCurrencyPrecise(Number(amount) || 0);
  const when = capturedAt ? formatDateTime(capturedAt) : '';

  const rows = [
    { key: 'customer', label: t('deposit.receipt.customer'), value: String(customerName ?? '') },
    { key: 'account', label: t('deposit.receipt.account'), value: maskedAccount },
    { key: 'amount', label: t('deposit.receipt.amount'), value: depositedAmount },
    ...(posted && customerBalanceAfter
      ? [
          {
            key: 'balance',
            label: t('deposit.receipt.newBalance'),
            value: formatCurrencyPrecise(Number(customerBalanceAfter) || 0),
          },
        ]
      : []),
    { key: 'txn', label: t('deposit.receipt.transactionId'), value: String(transactionId ?? '') },
    { key: 'when', label: t('deposit.receipt.dateTime'), value: when },
    // Who took the cash. A customer holding a receipt for money handed to a
    // person needs that person named on it, not just an account number.
    ...(agent?.name
      ? [
          {
            key: 'agent',
            label: t('deposit.receipt.receivedBy'),
            value: [agent.name, agent.code].filter(Boolean).join(' · '),
          },
        ]
      : []),
    // The server's own word, not a hardcoded "Successful" — a Pending deposit
    // must not print a receipt that says the money is in.
    { key: 'status', label: t('deposit.receipt.statusLabel'), value: String(status ?? '') },
  ];

  const [sharing, setSharing] = useState(false);

  /**
   * Shares the receipt as a PDF FILE, not as a line of text — a customer's
   * proof of payment has to be a document they can keep, print or forward, and
   * a typed message is proof of nothing.
   *
   * The PDF prints the same rows on screen, from the same server values, so
   * the paper and the screen can never disagree.
   */
  const onShare = async () => {
    if (sharing) return;
    setSharing(true);

    try {
      const shared = await shareReceiptPdf({
        html: buildReceiptHtml({
          posted,
          // The letterhead. Null falls back to the app's name in text.
          logo: await logoDataUri(),
          documentTitle: t('deposit.receipt.title'),
          subtitle: t('deposit.receipt.subtitle'),
          amountLabel: t('deposit.receipt.amount'),
          amount: depositedAmount,
          status: String(status ?? ''),
          // A pending deposit says so on the paper too, or the customer walks
          // away with a receipt for money that has not arrived.
          note: posted ? null : t('deposit.receipt.pendingNote'),
          rows,
          footer: t('deposit.receipt.footer', { appName: brand.appName }),
        }),
        // What the customer sees the file called.
        fileName: t('deposit.receipt.fileName', {
          reference: String(transactionId ?? '').replace(/[^\w-]/g, '') || 'receipt',
        }),
        dialogTitle: t('deposit.receipt.title'),
      });

      if (!shared) toast.info(t('deposit.receipt.shareUnavailable'));
    } catch (error) {
      toast.error(error?.message ?? t('common.errors.generic'));
    } finally {
      setSharing(false);
    }
  };

  return (
    <View className="flex-1 bg-primary">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Receipt head, on paper. */}
        <SafeAreaView edges={['top']} className="bg-card">
          <View className="items-end px-5 pt-2">
            <BrandLogo size={44} showName={false} tone="brand" />
          </View>

          <View className="items-center px-8 pb-6">
            <MaterialCommunityIcons
              name={posted ? 'check-decagram' : 'clock-outline'}
              size={56}
              color={posted ? colors.success : colors.warning}
            />
            <Text className="mt-4 text-[19px] font-bold text-ink">
              {posted ? t('deposit.success.title') : t('deposit.success.pendingTitle')}
            </Text>
            <Text className="mt-2 text-[15px] text-ink-muted">{brand.appName}</Text>
            <Text className="mt-1 text-[12px] text-ink-soft">{t('deposit.receipt.title')}</Text>
          </View>
        </SafeAreaView>

        {/* The tear between head and body. */}
        <ScallopedEdge tone="bg-card" />

        <DetailRows rows={rows} tone="primary" className="rounded-none px-2" />

        <View className="px-5 pb-10 pt-8">
          <Button
            variant="outline"
            size="lg"
            icon="share-outline"
            label={t('deposit.receipt.share')}
            loading={sharing}
            onPress={onShare}
          />
        </View>
      </ScrollView>
    </View>
  );
}
