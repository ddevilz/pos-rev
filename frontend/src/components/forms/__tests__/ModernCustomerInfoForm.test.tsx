import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModernCustomerInfoForm from '../ModernCustomerInfoForm';
import { apiSlice } from '@/store/api/apiSlice';

// Mock customers data
const mockCustomers = [
  { id: 1, cname: 'John Doe', mobile: '1234567890', add1: '123 Main St' },
  { id: 2, cname: 'Jane Smith', mobile: '0987654321', add1: '456 Oak Ave' },
];

// Mock the customer API
const mockCustomerApi = {
  useGetCustomersQuery: vi.fn(() => ({
    data: mockCustomers,
    isLoading: false,
    isError: false,
  })),
};

vi.mock('@/store/api/customerApi', () => mockCustomerApi);

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = configureStore({
    reducer: {
      api: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });

  return <Provider store={store}>{children}</Provider>;
};

const CustomerFormTestComponent = () => {
  const form = useForm({
    defaultValues: {
      customer_id: 0,
      mobile: '',
      cname: '',
      add1: '',
    },
  });

  return (
    <TestWrapper>
      <ModernCustomerInfoForm form={form} loading={false} />
    </TestWrapper>
  );
};

describe('ModernCustomerInfoForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<CustomerFormTestComponent />);

    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
  });

  it('accepts user input in form fields', () => {
    render(<CustomerFormTestComponent />);

    const mobileInput = screen.getByPlaceholderText('9876541230');
    const nameInput = screen.getByPlaceholderText('Name');
    const addressInput = screen.getByPlaceholderText('Address');

    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(addressInput, { target: { value: '123 Main St' } });

    expect(mobileInput).toHaveValue('1234567890');
    expect(nameInput).toHaveValue('John Doe');
    expect(addressInput).toHaveValue('123 Main St');
  });

  it('shows customer search dropdown when typing mobile number', async () => {
    mockCustomerApi.useGetCustomersQuery.mockReturnValue({
      data: mockCustomers,
      isLoading: false,
      isError: false,
    });

    render(<CustomerFormTestComponent />);

    const mobileInput = screen.getByPlaceholderText('9876541230');
    
    // Type enough characters to trigger search
    fireEvent.change(mobileInput, { target: { value: '12' } });

    await waitFor(() => {
      expect(mockCustomerApi.useGetCustomersQuery).toHaveBeenCalledWith(
        { search: '12', limit: 10 },
        { skip: false }
      );
    });
  });

  it('does not trigger search for short input', () => {
    render(<CustomerFormTestComponent />);

    const mobileInput = screen.getByPlaceholderText('9876541230');
    
    // Type only one character
    fireEvent.change(mobileInput, { target: { value: '1' } });

    expect(mockCustomerApi.useGetCustomersQuery).toHaveBeenCalledWith(
      { search: '1', limit: 10 },
      { skip: true }
    );
  });

  it('handles customer selection from dropdown', async () => {
    mockCustomerApi.useGetCustomersQuery.mockReturnValue({
      data: mockCustomers,
      isLoading: false,
      isError: false,
    });

    render(<CustomerFormTestComponent />);

    const mobileInput = screen.getByPlaceholderText('9876541230');
    
    // Trigger search
    fireEvent.change(mobileInput, { target: { value: '123' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe - 1234567890')).toBeInTheDocument();
    });

    // Click on customer
    fireEvent.click(screen.getByText('John Doe - 1234567890'));

    // Check that form is populated
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
  });

  it('shows loading state when customers are loading', () => {
    mockCustomerApi.useGetCustomersQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<CustomerFormTestComponent />);

    const mobileInput = screen.getByPlaceholderText('9876541230');
    fireEvent.change(mobileInput, { target: { value: '123' } });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state when customer loading fails', () => {
    mockCustomerApi.useGetCustomersQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<CustomerFormTestComponent />);

    expect(screen.getByText(/error loading customers/i)).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    mockCustomerApi.useGetCustomersQuery.mockReturnValue({
      data: mockCustomers,
      isLoading: false,
      isError: false,
    });

    render(<CustomerFormTestComponent />);

    const mobileInput = screen.getByPlaceholderText('9876541230');
    
    // Open dropdown
    fireEvent.change(mobileInput, { target: { value: '123' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe - 1234567890')).toBeInTheDocument();
    });

    // Click outside (on document body)
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('John Doe - 1234567890')).not.toBeInTheDocument();
    });
  });

  it('handles disabled state correctly', () => {
    const DisabledFormComponent = () => {
      const form = useForm({
        defaultValues: {
          customer_id: 0,
          mobile: '',
          cname: '',
          add1: '',
        },
      });

      return (
        <TestWrapper>
          <ModernCustomerInfoForm form={form} loading={true} />
        </TestWrapper>
      );
    };

    render(<DisabledFormComponent />);

    const mobileInput = screen.getByPlaceholderText('9876541230');
    const nameInput = screen.getByPlaceholderText('Name');
    const addressInput = screen.getByPlaceholderText('Address');

    expect(mobileInput).toBeDisabled();
    expect(nameInput).toBeDisabled();
    expect(addressInput).toBeDisabled();
  });
});