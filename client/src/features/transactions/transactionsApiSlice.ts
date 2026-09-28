import { api } from "@/store/apiSlice";
import type {
  SafeTransaction,
  PaginatedTransactions,
  TransactionFilters,
} from "@/types";

interface TransactionResponse {
  transaction: SafeTransaction;
}

export const transactionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<PaginatedTransactions, TransactionFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        if (filters.sort) params.set("sort", filters.sort);
        if (filters.type) params.set("type", filters.type);
        if (filters.search) params.set("search", filters.search);
        if (filters.category_id) params.set("category_id", filters.category_id);
        if (filters.date_from) params.set("date_from", filters.date_from);
        if (filters.date_to) params.set("date_to", filters.date_to);
        if (filters.min_amount) params.set("min_amount", filters.min_amount);
        if (filters.max_amount) params.set("max_amount", filters.max_amount);
        const qs = params.toString();
        return `/transactions${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (res: { data: PaginatedTransactions }) => res.data,
      providesTags: (result) =>
        result
          ? [
              ...result.transactions.map(({ id }) => ({
                type: "Transactions" as const,
                id,
              })),
              { type: "Transactions", id: "LIST" },
            ]
          : [{ type: "Transactions", id: "LIST" }],
    }),

    getTransactionById: builder.query<SafeTransaction, string>({
      query: (id) => `/transactions/${id}`,
      transformResponse: (res: { data: TransactionResponse }) =>
        res.data.transaction,
      providesTags: (_result, _error, id) => [{ type: "Transactions", id }],
    }),

    createTransaction: builder.mutation<
      SafeTransaction,
      {
        categoryId: string;
        type: string;
        amount: number;
        description?: string | null;
        transactionDate: string;
      }
    >({
      query: (body) => ({
        url: "/transactions",
        method: "POST",
        body,
      }),
      transformResponse: (res: { data: TransactionResponse }) =>
        res.data.transaction,
      invalidatesTags: [
        { type: "Transactions", id: "LIST" },
        "Dashboard",
        "Analytics",
        "Budgets",
      ],
    }),

    updateTransaction: builder.mutation<
      SafeTransaction,
      {
        id: string;
        categoryId?: string;
        type?: string;
        amount?: number;
        description?: string | null;
        transactionDate?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/transactions/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: { data: TransactionResponse }) =>
        res.data.transaction,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Transactions", id },
        { type: "Transactions", id: "LIST" },
        "Dashboard",
        "Analytics",
        "Budgets",
      ],
    }),

    deleteTransaction: builder.mutation<void, string>({
      query: (id) => ({
        url: `/transactions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Transactions", id: "LIST" },
        "Dashboard",
        "Analytics",
        "Budgets",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTransactionsQuery,
  useGetTransactionByIdQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionsApi;
