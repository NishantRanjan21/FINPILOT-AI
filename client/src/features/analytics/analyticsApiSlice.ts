import { api } from "@/store/apiSlice";
import type {
  MonthlySummaryItem,
  CategoryBreakdownItem,
  TrendItem,
} from "@/types";

export const analyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMonthlySummary: builder.query<
      MonthlySummaryItem[],
      { from?: string; to?: string }
    >({
      query: ({ from, to } = {}) => {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const qs = params.toString();
        return `/analytics/monthly-summary${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (res: { data: MonthlySummaryItem[] }) => res.data,
      providesTags: ["Analytics"],
    }),

    getCategoryBreakdown: builder.query<
      CategoryBreakdownItem[],
      { from?: string; to?: string }
    >({
      query: ({ from, to } = {}) => {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const qs = params.toString();
        return `/analytics/category-breakdown${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (res: { data: CategoryBreakdownItem[] }) => res.data,
      providesTags: ["Analytics"],
    }),

    getTrend: builder.query<TrendItem[], { months?: number }>({
      query: ({ months = 6 } = {}) =>
        `/analytics/trend?months=${months}`,
      transformResponse: (res: { data: TrendItem[] }) => res.data,
      providesTags: ["Analytics"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMonthlySummaryQuery,
  useGetCategoryBreakdownQuery,
  useGetTrendQuery,
} = analyticsApi;
