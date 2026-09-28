import { useAppSelector } from "./redux";
import { formatCurrency } from "@/utils/format";

/**
 * Returns a currency formatter bound to the user's current preference.
 * Use this everywhere money is displayed.
 */
export function useCurrency() {
  const user = useAppSelector((state) => state.auth.user);
  const currency = user?.currencyPreference ?? "USD";

  return {
    currency,
    format: (amount: number) => formatCurrency(amount, currency),
  };
}
