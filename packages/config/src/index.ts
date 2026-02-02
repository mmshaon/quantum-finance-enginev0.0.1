export const APP_NAME = 'Quantum Finance Engine';
export const COMPANY_NAME = 'Alpha Ultimate Ltd';
export const CREATOR_NAME = 'Mohammad Maynul Hasan';

export const LANGUAGES = {
  en: 'English',
  bn: 'বাংলা',
  ar: 'العربية'
} as const;

export const CURRENCIES = {
  SAR: { symbol: 'ر.س', name: 'Saudi Riyal' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  BDT: { symbol: '৳', name: 'Bangladeshi Taka' }
} as const;

export const THEME_COLORS = {
  primary: '#00bcd4',
  secondary: '#00e5ff',
  background: 'linear-gradient(135deg, #002b36, #003f5c, #004d6b)',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3'
};

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  EXPENSES: {
    LIST: '/expenses',
    CREATE: '/expenses',
    GET: (id: string) => `/expenses/${id}`,
    UPDATE: (id: string) => `/expenses/${id}`,
    DELETE: (id: string) => `/expenses/${id}`,
    APPROVE: (id: string) => `/expenses/${id}/approve`,
    REJECT: (id: string) => `/expenses/${id}/reject`
  },
  INCOME: {
    LIST: '/income',
    CREATE: '/income',
    GET: (id: string) => `/income/${id}`,
    UPDATE: (id: string) => `/income/${id}`,
    DELETE: (id: string) => `/income/${id}`,
    PDF: (id: string) => `/income/${id}/pdf`
  },
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    GET: (id: string) => `/projects/${id}`,
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`
  },
  STAFF: {
    LIST: '/staff',
    CREATE: '/staff',
    GET: (id: string) => `/staff/${id}`,
    UPDATE: (id: string) => `/staff/${id}`,
    DELETE: (id: string) => `/staff/${id}`
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    CHARTS: '/dashboard/charts'
  }
};

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_MIN_LENGTH: 10,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

export const MODULE_KEYS = {
  DASHBOARD: 'DASHBOARD',
  EXPENSES: 'EXPENSES',
  INCOME: 'INCOME',
  INVESTMENTS: 'INVESTMENTS',
  ASSETS: 'ASSETS',
  LIABILITIES: 'LIABILITIES',
  PROJECTS: 'PROJECTS',
  HR_ADMIN: 'HR_ADMIN',
  CONTROL_PANEL: 'CONTROL_PANEL',
  SETTINGS: 'SETTINGS',
  CONTACT: 'CONTACT'
} as const;
