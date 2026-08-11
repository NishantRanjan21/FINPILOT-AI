export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "JPY",
  "CAD",
  "AUD"
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export interface UpdateProfileInput {
  fullName?: string;
  currencyPreference?: string;
  themePreference?: string;
}

export interface ChangePasswordInput {
  currentPassword?: string;
  newPassword?: string;
}
