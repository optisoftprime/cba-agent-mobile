/**
 * Placeholder data, standing in for the endpoints in src/api/endpoints.js until
 * the backend exists. Kept in the api layer on purpose: when the real calls
 * land, screens keep calling `getCustomers()` / `getLoans()` and only these
 * bodies change.
 *
 * Loans are stored ON the customer and flattened by getLoans(), so the loans
 * list and a customer's own Loans tab can never disagree.
 */

let sequence = 0;
const nextId = (prefix) => `${prefix}-${(sequence += 1)}`;

/** Six months of schedule rows, oldest first — paid, then due, then upcoming. */
function makeSchedule(reference) {
  const statuses = ['paid', 'paid', 'due', 'upcoming', 'upcoming', 'upcoming'];
  const months = ['15 Mar 2026', '15 Apr 2026', '15 May 2026', '15 Jun 2026', '15 Jul 2026', '15 Aug 2026'];

  return months.map((date, index) => ({
    id: `${reference.toLowerCase()}-r${index + 1}`,
    date,
    status: statuses[index],
    outstanding: 50_000,
    nextPayment: 11_850,
    totalDue: 41_850,
  }));
}

function makeLoan({
  product = 'Business Loan',
  reference,
  principal = 1_000_000,
  outstanding = 650_000,
  nextPayment = 41_850,
  dueDate = '15 Aug 2026',
  status = 'active',
  interestRate = '18% p.a.',
  tenureMonths = 24,
  maturityDate = '15 Mar 2028',
}) {
  return {
    id: reference.toLowerCase(),
    product,
    reference,
    principal,
    outstanding,
    nextPayment,
    dueDate,
    status,
    interestRate,
    tenureMonths,
    maturityDate,
    repayments: makeSchedule(reference),
    activity: [
      { id: `${reference.toLowerCase()}-a1`, amount: 41_850, date: '15 Jul 2026' },
      { id: `${reference.toLowerCase()}-a2`, amount: 41_850, date: '15 Jun 2026' },
    ],
  };
}

function makeCustomer({
  name,
  code,
  type = 'individual',
  status = 'active',
  segment = 'retail',
  accounts,
  loans = [],
}) {
  return {
    id: code.toLowerCase(),
    name,
    code,
    type,
    status,
    segment,
    accounts: accounts.map((account) => ({ id: nextId('acc'), status: 'active', ...account })),
    loans: loans.map(makeLoan),
    activity: [
      {
        id: nextId('act'),
        title: 'Repayment recorded',
        amount: 41_850,
        reference: loans[0]?.reference,
        date: '15 Jul 2026',
      },
      {
        id: nextId('act'),
        title: 'Customer Assigned',
        detail: 'Assigned to AG-09875',
        date: '15 Jul 2026',
      },
    ],
  };
}

const STANDARD_ACCOUNTS = [
  { name: 'Savings Account', number: '0123456789', balance: 250_000 },
  { name: 'Current Account', number: '0123456790', balance: 520_000 },
  { name: 'Fixed Account', number: '0123456791', balance: 250_000 },
];

const CUSTOMERS = [
  makeCustomer({
    name: 'John Doe',
    code: 'CUS-00125',
    segment: 'sme',
    accounts: STANDARD_ACCOUNTS,
    loans: [{ reference: 'LN-00125' }],
  }),
  makeCustomer({
    name: 'Adebayo Musa',
    code: 'CUS-0987',
    segment: 'sme',
    accounts: STANDARD_ACCOUNTS,
    loans: [{ reference: 'LN-00126', status: 'overdue', dueDate: '15 Jul 2026' }],
  }),
  makeCustomer({
    name: 'Grace Eze',
    code: 'CUS-0129',
    accounts: STANDARD_ACCOUNTS.slice(0, 2),
    loans: [{ product: 'Personal Loan', reference: 'LN-09837', status: 'due' }],
  }),
  makeCustomer({
    name: 'Chinedu Okafor',
    code: 'CUS-0441',
    status: 'inactive',
    accounts: STANDARD_ACCOUNTS.slice(0, 1),
  }),
  makeCustomer({
    name: 'Fatima Bello',
    code: 'CUS-0302',
    type: 'corporate',
    segment: 'sme',
    accounts: STANDARD_ACCOUNTS,
    loans: [
      { reference: 'LN-00130' },
      { product: 'Asset Finance', reference: 'LN-00131', status: 'due', outstanding: 420_000 },
    ],
  }),
  makeCustomer({
    name: 'Emeka Nwosu',
    code: 'CUS-0778',
    accounts: STANDARD_ACCOUNTS.slice(0, 1),
    loans: [{ product: 'Personal Loan', reference: 'LN-00132' }],
  }),
  makeCustomer({
    name: 'Aisha Lawal',
    code: 'CUS-0555',
    status: 'inactive',
    segment: 'sme',
    accounts: STANDARD_ACCOUNTS.slice(0, 2),
  }),
  makeCustomer({
    name: 'Ngozi Obi',
    code: 'CUS-0234',
    segment: 'sme',
    accounts: STANDARD_ACCOUNTS.slice(0, 1),
    loans: [{ reference: 'LN-00133', status: 'overdue', dueDate: '01 Aug 2026' }],
  }),
];

export function getCustomers() {
  return CUSTOMERS;
}

export function getCustomerById(id) {
  return CUSTOMERS.find((customer) => customer.id === String(id).toLowerCase()) ?? null;
}

/** Every loan the agent is assigned, with its customer attached for display. */
export function getLoans() {
  return CUSTOMERS.flatMap((customer) =>
    customer.loans.map((loan) => ({
      ...loan,
      customerId: customer.id,
      customerName: customer.name,
    })),
  );
}

/** A single loan with its customer attached, by loan id (the reference). */
export function getLoanById(id) {
  return getLoans().find((loan) => loan.id === String(id).toLowerCase()) ?? null;
}

const TICKETS = [
  {
    id: 'TCK-0987',
    subject: 'Customer account cannot be accesed',
    category: 'Account Issue',
    date: '10 Aug 2026',
    status: 'inProgress',
    priority: 'high',
  },
  {
    id: 'TCK-0988',
    subject: 'Repayment not reflecting on statement',
    category: 'Account Issue',
    date: '10 Aug 2026',
    status: 'open',
    priority: 'medium',
  },
  {
    id: 'TCK-0989',
    subject: 'Loan disbursement delayed',
    category: 'Loan Issue',
    date: '08 Aug 2026',
    status: 'resolved',
    priority: 'low',
  },
  {
    id: 'TCK-0990',
    subject: 'Customer BVN mismatch',
    category: 'Account Issue',
    date: '07 Aug 2026',
    status: 'open',
    priority: 'high',
  },
];

export function getTickets() {
  return TICKETS;
}

/** Counts for the three tiles at the top of the Support screen. */
export function getTicketCounts() {
  return {
    open: TICKETS.filter((ticket) => ticket.status === 'open').length,
    inProgress: TICKETS.filter((ticket) => ticket.status === 'inProgress').length,
    resolved: TICKETS.filter((ticket) => ticket.status === 'resolved').length,
  };
}

/** How a deposit can be tendered. */
export function getPaymentMethods() {
  return ['cash', 'transfer', 'cheque', 'pos'];
}

/** One account, looked up across every customer. */
export function getAccountById(id) {
  for (const customer of CUSTOMERS) {
    const account = customer.accounts.find((entry) => entry.id === String(id));
    if (account) return { ...account, customerId: customer.id, customerName: customer.name };
  }
  return null;
}

/**
 * Post a deposit. Template values for now — the real call returns the
 * transaction id, the server timestamp and the resulting balance.
 */
export function postDeposit({ accountId, amount }) {
  const account = getAccountById(accountId);

  return {
    transactionId: 'TRN00045821',
    dateTime: '13 Aug 2026 · 10:42 AM',
    newBalance: (account?.balance ?? 0) + (Number(amount) || 0),
    status: 'successful',
  };
}

/** Money collected, across every assigned customer. */
const COLLECTIONS = [
  { id: 'col-1', amount: 10_000, type: 'ajo', customerName: 'Mary Johnson', when: '29 Aug, 9:30 AM' },
  { id: 'col-2', amount: 50_000, type: 'deposit', customerName: 'Jane Smith', when: '29 Aug, 10:15 AM' },
  { id: 'col-3', amount: 10_000, type: 'ajo', customerName: 'Mary Johnson', when: '29 Aug, 9:30 AM' },
  { id: 'col-4', amount: 10_000, type: 'ajo', customerName: 'Mary Johnson', when: '29 Aug, 9:30 AM' },
  { id: 'col-5', amount: 50_000, type: 'deposit', customerName: 'Jane Smith', when: '29 Aug, 10:15 AM' },
  { id: 'col-6', amount: 5_000, type: 'ajo', customerName: 'John Doe', when: '29 Aug, 10:42 AM' },
].map((entry) => ({
  ...entry,
  status: 'successful',
  account: '0123456789',
  method: 'cash',
  transactionId: 'TRN00045821',
  dateTime: '29 Aug 2026, 10:42 AM',
}));

export function getCollections() {
  return COLLECTIONS;
}

export function getCollectionById(id) {
  return COLLECTIONS.find((entry) => entry.id === String(id)) ?? null;
}

/** The four totals above the collection history. */
export function getCollectionSummary() {
  return { today: 185_000, week: 580_000, month: 2_450_000, total: 8_750_000 };
}
