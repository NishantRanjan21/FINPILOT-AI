export interface User {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  currency_preference: string;
  theme_preference: string;
  created_at: Date;
  updated_at: Date | null;
}

export interface SafeUser {
  id: string;
  fullName: string;
  email: string;
  currencyPreference: string;
  themePreference: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export const toSafeUser = (user: User): SafeUser => {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    currencyPreference: user.currency_preference,
    themePreference: user.theme_preference,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
};
