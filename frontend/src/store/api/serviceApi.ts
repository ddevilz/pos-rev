import { apiSlice } from './apiSlice';
import type { Service, ServiceFormData, ApiResponse } from '@/types';

export const serviceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query<Service[], { 
      search?: string; 
      category_id?: number; 
      itype?: string; 
      is_active?: boolean;
    }>({
      query: (params = {}) => ({
        url: '/services',
        params,
      }),
      transformResponse: (response: ApiResponse<Service[]>) => response.data,
      providesTags: ['Service'],
    }),
    getService: builder.query<Service, number>({
      query: (id) => `/services/${id}`,
      transformResponse: (response: ApiResponse<Service>) => response.data,
      providesTags: (result, error, id) => {
        void result; void error;
        return [{ type: 'Service', id }];
      },
    }),
    getServicesByCategory: builder.query<Service[], number>({
      query: (categoryId) => `/services/category/${categoryId}`,
      transformResponse: (response: ApiResponse<Service[]>) => response.data,
      providesTags: ['Service'],
    }),
    createService: builder.mutation<Service, ServiceFormData>({
      query: (data) => ({
        url: '/services',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Service>) => response.data,
      invalidatesTags: ['Service'],
    }),
    updateService: builder.mutation<Service, { id: number; data: Partial<ServiceFormData> }>({
      query: ({ id, data }) => ({
        url: `/services/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Service>) => response.data,
      invalidatesTags: (result, error, { id }) => {
        void result; void error;
        return [{ type: 'Service', id }, 'Service'];
      },
    }),
    deleteService: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/services/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) => response.data,
      invalidatesTags: (result, error, id) => {
        void result; void error;
        return [{ type: 'Service', id }, 'Service'];
      },
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceQuery,
  useGetServicesByCategoryQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} = serviceApi;