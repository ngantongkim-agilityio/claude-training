export const ROUTES = {
  ROOT: '/',
  DOCS: '/docs',

  AUTH: {
    ROOT: '/auth',
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
  },

  USERS: {
    ROOT: '/users',
    ME: '/me',
  },

  INVOICES: {
    ROOT: '/invoices',
    BY_NUMBER: (invoiceNumber = ':invoiceNumber') =>
      `/invoices/${invoiceNumber}`,
    HISTORY: (invoiceNumber = ':invoiceNumber') =>
      `/invoices/${invoiceNumber}/history`,
  },

  REPORTS: {
    ROOT: '/reports',
    INVOICES: '/reports/invoices',
    PDF: '/reports/invoices/pdf',
    EMAIL: '/reports/invoices/email',
  },
}
