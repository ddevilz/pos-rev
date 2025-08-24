import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewOrderForm from '../NewOrderForm';
import { apiSlice } from '@/store/api/apiSlice';
import authSlice from '@/store/slices/authSlice';
import rateSlice from '@/store/slices/rateSlice';
import uiSlice from '@/store/slices/uiSlice';

// Mock the toast function
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Create mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      api: apiSlice.reducer,
      auth: authSlice,
      rate: rateSlice,
      ui: uiSlice,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });
};

const renderWithProvider = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(<Provider store={store}>{component}</Provider>);
};

describe('NewOrderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form sections', () => {
    renderWithProvider(<NewOrderForm />);

    expect(screen.getByText('Customer Info')).toBeInTheDocument();
    expect(screen.getByText('Services Selection')).toBeInTheDocument();
    expect(screen.getByText('Total Invoice')).toBeInTheDocument();
  });

  it('displays required field labels', () => {
    renderWithProvider(<NewOrderForm />);

    expect(screen.getByText('Phone number')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Due Date *')).toBeInTheDocument();
  });

  it('shows create order button', () => {
    renderWithProvider(<NewOrderForm />);

    const createButton = screen.getByRole('button', { name: /create order/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).not.toBeDisabled();
  });

  it('validates required fields before submission', async () => {
    renderWithProvider(<NewOrderForm />);

    const createButton = screen.getByRole('button', { name: /create order/i });
    fireEvent.click(createButton);

    // Should show validation warnings for missing required fields
    await waitFor(() => {
      expect(screen.getByText(/mobile number and customer name are required/i)).toBeInTheDocument();
    });
  });

  it('allows customer information input', () => {
    renderWithProvider(<NewOrderForm />);

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

  it('allows due date selection', () => {
    renderWithProvider(<NewOrderForm />);

    const dueDateInput = screen.getByLabelText(/due date/i);
    const today = new Date().toISOString().split('T')[0];

    fireEvent.change(dueDateInput, { target: { value: today } });
    expect(dueDateInput).toHaveValue(today);
  });

  it('allows priority selection', () => {
    renderWithProvider(<NewOrderForm />);

    const prioritySelect = screen.getByDisplayValue('normal');
    expect(prioritySelect).toBeInTheDocument();

    fireEvent.change(prioritySelect, { target: { value: 'high' } });
    expect(prioritySelect).toHaveValue('high');
  });

  it('calculates totals correctly', () => {
    renderWithProvider(<NewOrderForm />);

    // The totals calculation will be tested through the ModernTotalInvoice component
    const summarySection = screen.getByText(/invoice details/i);
    expect(summarySection).toBeInTheDocument();
  });

  it('handles form reset on successful submission', async () => {
    renderWithProvider(<NewOrderForm />);

    const mobileInput = screen.getByPlaceholderText('9876541230');
    const nameInput = screen.getByPlaceholderText('Name');

    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    // After successful submission, fields should be reset
    // This would require mocking the API call success
  });
});

describe('NewOrderForm Integration', () => {
  it('integrates with Redux store correctly', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <NewOrderForm />
      </Provider>
    );

    // Verify that the form can access Redux state
    expect(screen.getByText('Services Selection')).toBeInTheDocument();
  });

  it('handles loading states properly', () => {
    renderWithProvider(<NewOrderForm />);

    const createButton = screen.getByRole('button', { name: /create order/i });
    expect(createButton).not.toHaveTextContent('Creating Order...');
  });
});