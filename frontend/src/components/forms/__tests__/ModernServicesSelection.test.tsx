import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModernServicesSelection from '../ModernServicesSelection';
import { apiSlice } from '@/store/api/apiSlice';

// Mock data
const mockCategories = [
  { id: 1, catid: 'CAT001', category: 'Dry Clean', is_active: true },
  { id: 2, catid: 'CAT002', category: 'Wash & Fold', is_active: true },
];

const mockServices = [
  {
    id: 1,
    iname: 'Shirt Dry Clean',
    rate1: 50,
    rate2: 55,
    rate3: 60,
    rate4: 65,
    rate5: 70,
    is_active: true,
  },
  {
    id: 2,
    iname: 'Pants Dry Clean',
    rate1: 80,
    rate2: 85,
    rate3: 90,
    rate4: 95,
    rate5: 100,
    is_active: true,
  },
];

// Mock the APIs
const mockCategoryApi = {
  useGetCategoriesQuery: vi.fn(() => ({
    data: mockCategories,
    isLoading: false,
    isError: false,
  })),
};

const mockServiceApi = {
  useGetServicesQuery: vi.fn(() => ({
    data: mockServices,
    isLoading: false,
    isError: false,
  })),
};

vi.mock('@/store/api/categoryApi', () => mockCategoryApi);
vi.mock('@/store/api/serviceApi', () => mockServiceApi);

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

const ServicesSelectionTestComponent = ({ onAddService = vi.fn() } = {}) => {
  const form = useForm({
    defaultValues: {
      items: [],
    },
  });

  return (
    <TestWrapper>
      <ModernServicesSelection
        form={form}
        loading={false}
        onAddService={onAddService}
        selectedRate="rate1"
      />
    </TestWrapper>
  );
};

describe('ModernServicesSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders category selection view initially', () => {
    render(<ServicesSelectionTestComponent />);

    expect(screen.getByText('Select a Category')).toBeInTheDocument();
    expect(screen.getByText('Dry Clean')).toBeInTheDocument();
    expect(screen.getByText('Wash & Fold')).toBeInTheDocument();
  });

  it('shows loading state for categories', () => {
    mockCategoryApi.useGetCategoriesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<ServicesSelectionTestComponent />);

    expect(screen.getByText('Loading categories...')).toBeInTheDocument();
  });

  it('shows error state for categories', () => {
    mockCategoryApi.useGetCategoriesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<ServicesSelectionTestComponent />);

    expect(screen.getByText('Error loading categories')).toBeInTheDocument();
  });

  it('navigates to services view when category is clicked', async () => {
    render(<ServicesSelectionTestComponent />);

    const dryCleanCategory = screen.getByText('Dry Clean');
    fireEvent.click(dryCleanCategory);

    await waitFor(() => {
      expect(screen.getByText('Services in Dry Clean')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    // Should fetch services for the selected category
    expect(mockServiceApi.useGetServicesQuery).toHaveBeenCalledWith(
      { category_id: 1, is_active: true },
      { skip: false }
    );
  });

  it('shows services for selected category', async () => {
    render(<ServicesSelectionTestComponent />);

    // Click on category
    fireEvent.click(screen.getByText('Dry Clean'));

    await waitFor(() => {
      expect(screen.getByText('Shirt Dry Clean')).toBeInTheDocument();
      expect(screen.getByText('Pants Dry Clean')).toBeInTheDocument();
    });
  });

  it('goes back to category view when back button is clicked', async () => {
    render(<ServicesSelectionTestComponent />);

    // Navigate to services
    fireEvent.click(screen.getByText('Dry Clean'));
    
    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    // Click back
    fireEvent.click(screen.getByText('Back'));

    expect(screen.getByText('Select a Category')).toBeInTheDocument();
  });

  it('shows service addition form when service is clicked', async () => {
    render(<ServicesSelectionTestComponent />);

    // Navigate to services
    fireEvent.click(screen.getByText('Dry Clean'));
    
    await waitFor(() => {
      expect(screen.getByText('Shirt Dry Clean')).toBeInTheDocument();
    });

    // Click on service
    fireEvent.click(screen.getByText('Shirt Dry Clean'));

    await waitFor(() => {
      expect(screen.getByText('Add Service')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Service Name')).toHaveValue('Shirt Dry Clean');
      expect(screen.getByPlaceholderText('Rate')).toHaveValue(50);
      expect(screen.getByPlaceholderText('Quantity')).toHaveValue(1);
    });
  });

  it('uses correct rate based on selectedRate prop', async () => {
    const TestComponentWithRate2 = () => {
      const form = useForm({
        defaultValues: {
          items: [],
        },
      });

      return (
        <TestWrapper>
          <ModernServicesSelection
            form={form}
            loading={false}
            onAddService={vi.fn()}
            selectedRate="rate2"
          />
        </TestWrapper>
      );
    };

    render(<TestComponentWithRate2 />);

    // Navigate to services and select one
    fireEvent.click(screen.getByText('Dry Clean'));
    
    await waitFor(() => {
      expect(screen.getByText('Shirt Dry Clean')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Shirt Dry Clean'));

    await waitFor(() => {
      // Should use rate2 (55) instead of rate1 (50)
      expect(screen.getByPlaceholderText('Rate')).toHaveValue(55);
    });
  });

  it('calls onAddService when service is added', async () => {
    const mockOnAddService = vi.fn();
    
    const TestComponent = () => {
      const form = useForm({
        defaultValues: {
          items: [],
        },
      });

      return (
        <TestWrapper>
          <ModernServicesSelection
            form={form}
            loading={false}
            onAddService={mockOnAddService}
            selectedRate="rate1"
          />
        </TestWrapper>
      );
    };

    render(<TestComponent />);

    // Navigate to services and select one
    fireEvent.click(screen.getByText('Dry Clean'));
    
    await waitFor(() => {
      expect(screen.getByText('Shirt Dry Clean')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Shirt Dry Clean'));

    await waitFor(() => {
      expect(screen.getByText('Add Service')).toBeInTheDocument();
    });

    // Modify quantity and notes
    const quantityInput = screen.getByPlaceholderText('Quantity');
    const notesInput = screen.getByPlaceholderText('Notes');
    
    fireEvent.change(quantityInput, { target: { value: '2' } });
    fireEvent.change(notesInput, { target: { value: 'Test notes' } });

    // Submit the service
    const addButton = screen.getByRole('button', { name: /add service/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnAddService).toHaveBeenCalledWith(
        expect.objectContaining({
          iname: 'Shirt Dry Clean',
          rate: 50,
          quantity: 2,
          notes: 'Test notes',
          service_id: 1,
        })
      );
    });
  });

  it('resets service form after adding service', async () => {
    const mockOnAddService = vi.fn();
    
    render(<ServicesSelectionTestComponent onAddService={mockOnAddService} />);

    // Navigate and select service
    fireEvent.click(screen.getByText('Dry Clean'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Shirt Dry Clean'));
    });

    await waitFor(() => {
      expect(screen.getByText('Add Service')).toBeInTheDocument();
    });

    // Add the service
    const addButton = screen.getByRole('button', { name: /add service/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnAddService).toHaveBeenCalled();
      // Form should be hidden after adding
      expect(screen.queryByText('Add Service')).not.toBeInTheDocument();
    });
  });

  it('handles loading state correctly', () => {
    const DisabledComponent = () => {
      const form = useForm({
        defaultValues: {
          items: [],
        },
      });

      return (
        <TestWrapper>
          <ModernServicesSelection
            form={form}
            loading={true}
            onAddService={vi.fn()}
            selectedRate="rate1"
          />
        </TestWrapper>
      );
    };

    render(<DisabledComponent />);

    // Should still render but buttons would be disabled when in loading state
    expect(screen.getByText('Select a Category')).toBeInTheDocument();
  });

  it('shows services loading state', async () => {
    mockServiceApi.useGetServicesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<ServicesSelectionTestComponent />);

    fireEvent.click(screen.getByText('Dry Clean'));

    await waitFor(() => {
      expect(screen.getByText('Loading services...')).toBeInTheDocument();
    });
  });

  it('shows services error state', async () => {
    mockServiceApi.useGetServicesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<ServicesSelectionTestComponent />);

    fireEvent.click(screen.getByText('Dry Clean'));

    await waitFor(() => {
      expect(screen.getByText('Error loading services')).toBeInTheDocument();
    });
  });
});