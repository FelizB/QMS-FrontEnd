import type{ ErrorMap } from './errorTypes';

export const ERROR_MAP: ErrorMap = {
  // Auth/AuthZ
  UNAUTHENTICATED: {
    defaultMessage: 'Your session has expired. Please sign in again.',
    category: 'auth',
  },
  FORBIDDEN_ACTION: {
    defaultMessage: 'You do not have permission to perform this action.',
    category: 'permission',
  },

  // Users
  USER_DUPLICATE_EMAIL: {
    defaultMessage: 'This email is already registered.',
    category: 'conflict',
  },
  USER_ROLE_REQUIRED: {
    defaultMessage: 'A role must be selected.',
    category: 'validation',
  },

  // Maker-checker
  APPROVAL_REQUIRED: {
    defaultMessage: 'This action requires approval before it takes effect.',
    category: 'permission',
  },

  // Generic validations
  VALIDATION_ERROR: {
    defaultMessage: (e) =>
      e.field ? `The value for "${e.field}" is invalid.` : 'One or more fields are invalid.',
    category: 'validation',
  },

  // Server/Network
  NETWORK_ERROR: {
    defaultMessage: 'Unable to reach the server. Check your connection and try again.',
    category: 'network',
    retriable: true,
  },
  SERVER_ERROR: {
    defaultMessage: 'Something went wrong on our side. Please try again later.',
    category: 'server',
    retriable: true,
  },

  // Fallback
  UNKNOWN_ERROR: {
    defaultMessage: 'An unexpected error occurred.',
    category: 'unknown',
  },
};
