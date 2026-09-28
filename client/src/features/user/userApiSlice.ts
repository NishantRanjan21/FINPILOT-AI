import { api } from "@/store/apiSlice";
import { setUser } from "@/store/authSlice";
import type { SafeUser } from "@/types";

interface UserResponse {
  user: SafeUser;
}

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<SafeUser, void>({
      query: () => "/users/profile",
      transformResponse: (res: { data: UserResponse }) => res.data.user,
      providesTags: ["User"],
    }),

    updateProfile: builder.mutation<
      SafeUser,
      { fullName?: string; currencyPreference?: string; themePreference?: string }
    >({
      query: (body) => ({
        url: "/users/profile",
        method: "PATCH",
        body,
      }),
      transformResponse: (res: { data: UserResponse }) => res.data.user,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch {}
      },
      invalidatesTags: ["User", "Auth"],
    }),

    changePassword: builder.mutation<
      void,
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: "/users/password",
        method: "PATCH",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = userApi;
