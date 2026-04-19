import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Password validation schema
 * Requires: 8+ chars, uppercase, lowercase, number, special char
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * 2FA code validation (6 digits)
 */
export const totpCodeSchema = z
  .string()
  .regex(/^[0-9]{6}$/, '2FA code must be 6 digits');

/**
 * Ethereum address validation
 */
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

/**
 * USD amount validation (positive number with max 2 decimals)
 */
export const usdAmountSchema = z
  .number()
  .positive('Amount must be positive')
  .refine(
    (val) => Number.isInteger(val * 100),
    'Amount can have at most 2 decimal places'
  );

/**
 * Risk percentage validation (0.01 to 0.50 for max_bet_pct)
 */
export const maxBetPctSchema = z
  .number()
  .min(0.01, 'Maximum bet must be at least 1%')
  .max(0.50, 'Maximum bet cannot exceed 50%');

/**
 * Confidence percentage validation (0.50 to 0.95 for min_confidence)
 */
export const minConfidenceSchema = z
  .number()
  .min(0.50, 'Minimum confidence must be at least 50%')
  .max(0.95, 'Minimum confidence cannot exceed 95%');

/**
 * Login form validation
 */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  totp_code: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

/**
 * Registration form validation
 */
export const registerFormSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Withdraw form validation
 */
export const withdrawFormSchema = z.object({
  to_address: ethereumAddressSchema,
  amount_usd: usdAmountSchema,
  totp_code: z.string().optional(),
});

/**
 * Risk config form validation
 */
export const riskConfigSchema = z.object({
  max_bet_pct: maxBetPctSchema,
  min_confidence: minConfidenceSchema,
  use_kelly: z.boolean(),
});

/**
 * Password change form validation
 */
export const passwordChangeSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
    totp_code: z.string().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

/**
 * Validate Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  return ethereumAddressSchema.safeParse(address).success;
}

/**
 * Check password strength
 * Returns: 'weak', 'fair', 'good', 'strong'
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: 'weak' | 'fair' | 'good' | 'strong';
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return { score, label: 'weak', color: 'text-negative' };
  } else if (score <= 3) {
    return { score, label: 'fair', color: 'text-neutral' };
  } else if (score <= 4) {
    return { score, label: 'good', color: 'text-accent-primary' };
  } else {
    return { score, label: 'strong', color: 'text-positive' };
  }
}

/**
 * Check password requirements
 */
export function checkPasswordRequirements(password: string) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };
}

/**
 * Sanitize user input (basic XSS prevention)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
