import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Search, User, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateOrderMutation,
  useUpdateOrderMutation,
} from '@/store/api/orderApi';
import { useGetCustomersQuery } from '@/store/api/customerApi';
import { useGetServicesQuery } from '@/store/api/serviceApi';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { Order, Service, Customer } from '@/types';

const orderItemSchema = z.object({
  service_id: z.number().min(1, 'Service is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  rate: z.number().min(0.01, 'Rate must be greater than 0'),
  notes: z.string().optional(),
});

const orderSchema = z.object({
  customer_id: z.number().min(1, 'Customer is required'),
  due_date: z.string().optional().or(z.literal('')),
  due_time: z.string().optional().or(z.literal('')),
  pickup_date: z.string().optional().or(z.literal('')),
  delivery_date: z.string().optional().or(z.literal('')),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  discount_percentage: z.number().min(0).max(100).default(0),
  tax_percentage: z.number().min(0).max(100).default(0),
  advance_paid: z.number().min(0).default(0),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
}

const OrderForm = ({ isOpen, onClose, order }: OrderFormProps) => {
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const { data: customers = [] } = useGetCustomersQuery({ 
    search: customerSearch || undefined,
    limit: 20 
  });
  const { data: services = [] } = useGetServicesQuery({});
  const { selectedRate } = useSelector((state: RootState) => state.rate);

  const isEditing = !!order;
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_id: 0,
      due_date: '',
      due_time: '',
      pickup_date: '',
      delivery_date: '',
      priority: 'normal',
      discount_percentage: 0,
      tax_percentage: 0,
      advance_paid: 0,
      notes: '',
      items: [{ service_id: 0, quantity: 1, rate: 0, notes: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedDiscountPercentage = watch('discount_percentage');
  const watchedTaxPercentage = watch('tax_percentage');
  const watchedAdvancePaid = watch('advance_paid');

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = watchedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.rate);
    }, 0);
    
    const discountAmount = (subtotal * watchedDiscountPercentage) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * watchedTaxPercentage) / 100;
    const total = afterDiscount + taxAmount;
    const remaining = total - watchedAdvancePaid;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
      remaining: Math.max(0, remaining),
    };
  };

  const totals = calculateTotals();

  useEffect(() => {
    if (order) {
      setSelectedCustomer(order.customer || null);
      setValue('customer_id', order.customer_id);
      setValue('due_date', order.due_date || '');
      setValue('due_time', order.due_time || '');
      setValue('pickup_date', order.pickup_date || '');
      setValue('delivery_date', order.delivery_date || '');
      setValue('priority', order.priority);
      setValue('discount_percentage', order.discount_percentage);
      setValue('tax_percentage', order.tax_percentage);
      setValue('advance_paid', order.advance_paid);
      setValue('notes', order.notes || '');
      
      if (order.items && order.items.length > 0) {
        setValue('items', order.items.map(item => ({
          service_id: item.service_id,
          quantity: item.quantity,
          rate: item.rate,
          notes: item.notes || '',
        })));
      }
    } else {
      reset();
      setSelectedCustomer(null);
      setCustomerSearch('');
    }
  }, [order, setValue, reset]);

  const handleServiceChange = (index: number, serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setValue(`items.${index}.service_id`, serviceId);
      // Set rate based on selected rate tier
      const rate = service[selectedRate as keyof Service] as number || service.rate1;
      setValue(`items.${index}.rate`, rate);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setValue('customer_id', customer.id);
    setCustomerSearch('');
  };

  const onSubmit = async (data: OrderFormData) => {
    try {
      // Clean up empty strings to undefined for optional fields
      const cleanData = {
        ...data,
        due_date: data.due_date || undefined,
        due_time: data.due_time || undefined,
        pickup_date: data.pickup_date || undefined,
        delivery_date: data.delivery_date || undefined,
        notes: data.notes || undefined,
        items: data.items.map(item => ({
          ...item,
          notes: item.notes || undefined,
        })),
      };

      if (isEditing && order) {
        await updateOrder({ id: order.id, data: cleanData }).unwrap();
        toast.success('Order updated successfully!');
      } else {
        await createOrder(cleanData).unwrap();
        toast.success('Order created successfully!');
      }
      onClose();
      reset();
      setSelectedCustomer(null);
      setCustomerSearch('');
    } catch (error) {
      toast.error((error as any)?.data?.error?.message || 'An error occurred');
    }
  };

  const handleClose = () => {
    onClose();
    reset();
    setSelectedCustomer(null);
    setCustomerSearch('');
  };

  const addItem = () => {
    append({ service_id: 0, quantity: 1, rate: 0, notes: '' });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {isEditing ? `Edit Order ${order?.order_number}` : 'Create New Order'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedCustomer.cname}</p>
                    <p className="text-sm text-gray-500">{selectedCustomer.mobile}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setValue('customer_id', 0);
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {customerSearch && customers.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{customer.cname}</p>
                            <p className="text-xs text-gray-500">{customer.mobile}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.customer_id && (
              <p className="text-sm text-red-600">{errors.customer_id.message}</p>
            )}
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                type="date"
                {...register('due_date')}
                min={getTodayDate()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_time">Due Time</Label>
              <Input
                type="time"
                {...register('due_time')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup_date">Pickup Date</Label>
              <Input
                type="date"
                {...register('pickup_date')}
                min={getTodayDate()}
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Order Items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4 space-y-1">
                    <Label className="text-xs">Service</Label>
                    <Select
                      value={watchedItems[index]?.service_id?.toString() || ''}
                      onValueChange={(value) => handleServiceChange(index, parseInt(value))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.iname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      className="h-9"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Rate</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-9"
                      {...register(`items.${index}.rate`, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Amount</Label>
                    <div className="h-9 px-3 py-2 bg-gray-50 border rounded-md text-sm">
                      {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.rate || 0))}
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={fields.length === 1}
                      className="h-9"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {errors.items && (
              <p className="text-sm text-red-600">{errors.items.message}</p>
            )}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount_percentage">Discount %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register('discount_percentage', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_percentage">Tax %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register('tax_percentage', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="advance_paid">Advance Paid</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register('advance_paid', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(totals.discountAmount)}</span>
              </div>
            )}
            {totals.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(totals.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
            {watchedAdvancePaid > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Advance Paid:</span>
                  <span>{formatCurrency(watchedAdvancePaid)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Remaining:</span>
                  <span>{formatCurrency(totals.remaining)}</span>
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              {...register('notes')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Additional notes or instructions..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Order' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;