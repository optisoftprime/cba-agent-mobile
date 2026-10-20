import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * "1 Account 25 loans   2 PND" — a customer row's account and loan counts, plus
 * a red PND count when any of that customer's accounts is restricted, so the
 * agent sees it before opening or depositing to the customer.
 *
 * Shared by the My Customers list and the deposit customer picker: both read the
 * same, and PND lights up the same way in both. `pndAccounts` is the count the
 * customers list row carries — undefined on older responses, in which case the
 * red text simply does not render. No per-customer account fetch (that would be
 * a request per row on a scrolling list); the list row already has the count.
 */
export function CustomerSummary({ customer }) {
  const { t } = useTranslation();

  const accounts = customer.accounts ?? 0;
  const loans = customer.loans ?? 0;
  const pnd = Number(customer.pndAccounts ?? 0);

  const counts = [
    `${accounts} ${t(accounts === 1 ? 'customers.account' : 'customers.accounts')}`,
    `${loans} ${t(loans === 1 ? 'customers.loan' : 'customers.loans')}`,
  ].join(' ');

  return (
    <Text className="text-xs text-ink-muted">
      {counts}
      {pnd > 0 ? (
        <Text className="font-semibold text-danger">{`   ${pnd} ${t('customers.pnd')}`}</Text>
      ) : null}
    </Text>
  );
}
