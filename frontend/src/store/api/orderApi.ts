import { apiSlice } from './apiSlice';
import type { Order, OrderFormData, ApiResponse } from '@/types';

export interface OrderQueryParams {
  search?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  payment_status?: 'pending' | 'partial' | 'paid' | 'refunded';
  customer_id?: number;
  from_date?: string;
  to_date?: string;
  due_date?: string;
  limit?: number;
}

export interface OrderStatusUpdate {
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
}

export const orderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], OrderQueryParams>({
      query: (params = {}) => ({
        url: '/orders',
        params,
      }),
      transformResponse: (response: ApiResponse<Order[]>) => response.data,
      providesTags: ['Order'],
    }),
    getOrder: builder.query<Order, number>({
      query: (id) => `/orders/${id}`,
      transformResponse: (response: ApiResponse<Order>) => response.data,
      providesTags: (result, error, id) => {
        void result; void error;
        return [{ type: 'Order', id }];
      },
    }),
    createOrder: builder.mutation<Order, OrderFormData>({
      query: (data) => ({
        url: '/orders',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Order>) => response.data,
      invalidatesTags: ['Order', 'Customer'],
    }),
    updateOrder: builder.mutation<Order, { id: number; data: Partial<OrderFormData> }>({
      query: ({ id, data }) => ({
        url: `/orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Order>) => response.data,
      invalidatesTags: (result, error, { id }) => {
        void result; void error;
        return [
          { type: 'Order', id },
          'Order',
          'Customer',
        ];
      },
    }),
    updateOrderStatus: builder.mutation<Order, { id: number; data: OrderStatusUpdate }>({
      query: ({ id, data }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Order>) => response.data,
      invalidatesTags: (result, error, { id }) => {
        void result; void error;
        return [
          { type: 'Order', id },
          'Order',
        ];
      },
    }),
    deleteOrder: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) => response.data,
      invalidatesTags: (result, error, id) => {
        void result; void error;
        return [
          { type: 'Order', id },
          'Order',
          'Customer',
        ];
      },
    }),
    searchOrders: builder.query<Order[], string>({
      query: (query) => ({
        url: '/orders/search',
        params: { q: query },
      }),
      transformResponse: (response: ApiResponse<Order[]>) => response.data,
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
  useSearchOrdersQuery,
  useLazySearchOrdersQuery,
} = orderApi;