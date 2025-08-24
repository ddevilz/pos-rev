import { apiSlice } from './apiSlice';
import type { Customer, CustomerFormData, ApiResponse } from '@/types';

export interface CustomerQueryParams {
  search?: string;
  rtype?: 'regular' | 'premium' | 'vip';
  is_active?: boolean;
  city?: string;
  state?: string;
  limit?: number;
}

export interface CustomerStats {
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  avg_order_value: number;
}

export const customerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<Customer[], CustomerQueryParams>({
      query: (params = {}) => ({
        url: '/customers',
        params,
      }),
      transformResponse: (response: ApiResponse<Customer[]>) => response.data,
      providesTags: ['Customer'],
    }),
    getCustomer: builder.query<Customer, number>({
      query: (id) => `/customers/${id}`,
      transformResponse: (response: ApiResponse<Customer>) => response.data,
      providesTags: (result, error, id) => {
        void result; void error;
        return [{ type: 'Customer', id }];
      },
    }),
    getCustomerStats: builder.query<CustomerStats, number>({
      query: (id) => `/customers/${id}/stats`,
      transformResponse: (response: ApiResponse<CustomerStats>) => response.data,
      providesTags: (result, error, id) => {
        void result; void error;
        return [{ type: 'Customer', id: `${id}-stats` }];
      },
    }),
    createCustomer: builder.mutation<Customer, CustomerFormData>({
      query: (data) => ({
        url: '/customers',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Customer>) => response.data,
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation<Customer, { id: number; data: Partial<CustomerFormData> }>({
      query: ({ id, data }) => ({
        url: `/customers/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Customer>) => response.data,
      invalidatesTags: (result, error, { id }) => {
        void result; void error;
        return [
          { type: 'Customer', id },
          { type: 'Customer', id: `${id}-stats` },
          'Customer',
        ];
      },
    }),
    deleteCustomer: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) => response.data,
      invalidatesTags: (result, error, id) => {
        void result; void error;
        return [
          { type: 'Customer', id },
          { type: 'Customer', id: `${id}-stats` },
          'Customer',
        ];
      },
    }),
    toggleCustomerStatus: builder.mutation<Customer, number>({
      query: (id) => ({
        url: `/customers/${id}/toggle-status`,
        method: 'PATCH',
      }),
      transformResponse: (response: ApiResponse<Customer>) => response.data,
      invalidatesTags: (result, error, id) => {
        void result; void error;
        return [{ type: 'Customer', id }, 'Customer'];
      },
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useGetCustomerStatsQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useToggleCustomerStatusMutation,
} = customerApi;