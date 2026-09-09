/**
 * Status → StatusPill tone. Kept in one place so a status can never render with
 * two different colours on two different screens.
 */
export const CUSTOMER_STATUS_TONE = {
  active: 'success',
  inactive: 'neutral',
};

export const LOAN_STATUS_TONE = {
  active: 'success',
  due: 'warning',
  overdue: 'danger',
  closed: 'neutral',
};

export const ACCOUNT_STATUS_TONE = {
  active: 'success',
  dormant: 'neutral',
  closed: 'neutral',
};

export const TICKET_STATUS_TONE = {
  open: 'info',
  inProgress: 'info',
  resolved: 'success',
  closed: 'neutral',
};

/** Repayment schedule rows. Paid and upcoming both read blue in the designs. */
export const SCHEDULE_STATUS_TONE = {
  paid: 'info',
  upcoming: 'info',
  due: 'warning',
  missed: 'danger',
};
