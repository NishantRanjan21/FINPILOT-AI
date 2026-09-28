import { api } from "@/store/apiSlice";
import type { SafeCategory } from "@/types";

interface CategoriesResponse {
  categories: SafeCategory[];
}

interface CategoryResponse {
  category: SafeCategory;
}

export const categoriesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<SafeCategory[], void>({
      query: () => "/categories",
      transformResponse: (res: { data: CategoriesResponse }) =>
        res.data.categories,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Categories" as const, id })),
              { type: "Categories", id: "LIST" },
            ]
          : [{ type: "Categories", id: "LIST" }],
    }),

    createCategory: builder.mutation<
      SafeCategory,
      { name: string; type: string; color?: string }
    >({
      query: (body) => ({
        url: "/categories",
        method: "POST",
        body,
      }),
      transformResponse: (res: { data: CategoryResponse }) =>
        res.data.category,
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),

    updateCategory: builder.mutation<
      SafeCategory,
      { id: string; name?: string; color?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/categories/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: { data: CategoryResponse }) =>
        res.data.category,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Categories", id },
        { type: "Categories", id: "LIST" },
      ],
    }),

    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
