import { api } from "@/store/apiSlice";
import type { SafeBudget } from "@/types";

interface BudgetsResponse {
  budgets: SafeBudget[];
}

interface BudgetResponse {
  budget: SafeBudget;
}

export const budgetsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBudgets: builder.query<
      SafeBudget[],
      { month?: number; year?: number } | void
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters?.month) params.set("month", String(filters.month));
        if (filters?.year) params.set("year", String(filters.year));
        const qs = params.toString();
        return `/budgets${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (res: { data: BudgetsResponse }) => res.data.budgets,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Budgets" as const, id })),
              { type: "Budgets", id: "LIST" },
            ]
          : [{ type: "Budgets", id: "LIST" }],
    }),

    createBudget: builder.mutation<
      SafeBudget,
      {
        categoryId: string;
        month: number;
        year: number;
        limitAmount: number;
      }
    >({
      query: (body) => ({
        url: "/budgets",
        method: "POST",
        body,
      }),
      transformResponse: (res: { data: BudgetResponse }) => res.data.budget,
      invalidatesTags: [{ type: "Budgets", id: "LIST" }],
    }),

    updateBudget: builder.mutation<
      SafeBudget,
      {
        id: string;
        limitAmount?: number;
        month?: number;
        year?: number;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/budgets/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: { data: BudgetResponse }) => res.data.budget,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Budgets", id },
        { type: "Budgets", id: "LIST" },
      ],
    }),

    deleteBudget: builder.mutation<void, string>({
      query: (id) => ({
        url: `/budgets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Budgets", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBudgetsQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
} = budgetsApi;
