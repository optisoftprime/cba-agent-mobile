/**
 * Status → StatusPill tone. Kept in one place so a status can never render with
 * two different colours on two different screens.
 */
export const CUSTOMER_STATUS_TONE = {
  active: 'success',
  inactive: 'neutral',
};

/**
 * Loan statuses come straight from core banking, in its own casing
 * ("OVERDUE", "Performing", "Running", "Processing", "Completed"). Look them
 * up lowercased. All five below were observed on the live service; anything
 * new falls back to neutral rather than guessing a colour.
 */
export const LOAN_STATUS_TONE = {
  overdue: 'danger',
  due: 'warning',
  performing: 'success',
  running: 'success',
  active: 'success',
  processing: 'info',
  completed: 'neutral',
  closed: 'neutral',
};

export const ACCOUNT_STATUS_TONE = {
  active: 'success',
  dormant: 'neutral',
  closed: 'neutral',
};

/**
 * Repayment schedule rows. Live data returns OVERDUE / DUE / UPCOMING;
 * PAID is in the designs. Paid and upcoming both read blue there.
 */
export const SCHEDULE_STATUS_TONE = {
  paid: 'info',
  upcoming: 'info',
  due: 'warning',
  overdue: 'danger',
  missed: 'danger',
};

/** Collection movements. Values come from core banking, so look them up lowercased. */
export const COLLECTION_STATUS_TONE = {
  successful: 'success',
  success: 'success',
  posted: 'success',
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
  reversed: 'danger',
};

/**
 * Support tickets. The server's own list, from a rejected value:
 * [OPEN, PENDING, CLOSED, RESOLVED, IN_PROGRESS] — all five are covered here.
 */
export const TICKET_STATUS_TONE = {
  open: 'info',
  pending: 'warning',
  in_progress: 'info',
  inprogress: 'info',
  resolved: 'success',
  closed: 'neutral',
};

/**
 * Ajo plans. The server's values have NOT been seen (this agent has no plans),
 * so this covers the states the schema and the screen names imply and falls
 * back to neutral for anything else.
 */
export const AJO_STATUS_TONE = {
  active: 'success',
  running: 'success',
  successful: 'success',
  completed: 'success',
  matured: 'success',
  pending: 'warning',
  due: 'warning',
  overdue: 'danger',
  defaulted: 'danger',
  cancelled: 'neutral',
  closed: 'neutral',
};

/** Ticket priority, lowest to highest. */
export const TICKET_PRIORITY_TONE = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};
