import { api } from "@/store/apiSlice";
import type { SafeUser } from "@/types";

interface AuthResponse {
  user: SafeUser;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<SafeUser, void>({
      query: () => "/auth/me",
      transformResponse: (res: { data: AuthResponse }) => res.data.user,
      providesTags: ["Auth"],
    }),

    register: builder.mutation<
      SafeUser,
      { fullName: string; email: string; password: string }
    >({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      transformResponse: (res: { data: AuthResponse }) => res.data.user,
      invalidatesTags: ["Auth"],
    }),

    login: builder.mutation<
      SafeUser,
      { email: string; password: string }
    >({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      transformResponse: (res: { data: AuthResponse }) => res.data.user,
      invalidatesTags: ["Auth"],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: [
        "Auth",
        "User",
        "Categories",
        "Transactions",
        "Dashboard",
        "Budgets",
        "Analytics",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMeQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
} = authApi;
