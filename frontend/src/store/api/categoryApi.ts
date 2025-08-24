import { apiSlice } from './apiSlice';
import type { Category, CategoryFormData, ApiResponse } from '@/types';

export const categoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], { search?: string; is_active?: boolean }>({
      query: (params = {}) => ({
        url: '/categories',
        params,
      }),
      transformResponse: (response: ApiResponse<Category[]>) => response.data,
      providesTags: ['Category'],
    }),
    getCategory: builder.query<Category, number>({
      query: (id) => `/categories/${id}`,
      transformResponse: (response: ApiResponse<Category>) => response.data,
      providesTags: (result, error, id) => {
        void result; void error;
        return [{ type: 'Category', id }];
      },
    }),
    createCategory: builder.mutation<Category, CategoryFormData>({
      query: (data) => ({
        url: '/categories',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Category>) => response.data,
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation<Category, { id: number; data: Partial<CategoryFormData> }>({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Category>) => response.data,
      invalidatesTags: (result, error, { id }) => {
        void result; void error;
        return [{ type: 'Category', id }, 'Category'];
      },
    }),
    deleteCategory: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) => response.data,
      invalidatesTags: (result, error, id) => {
        void result; void error;
        return [{ type: 'Category', id }, 'Category'];
      },
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;