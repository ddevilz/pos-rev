import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Phone, Mail, MapPin, User } from 'lucide-react';

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
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from '@/store/api/customerApi';
import type { Customer } from '@/types';

// Mobile number validation regex for Indian numbers
const mobileRegex = /^[6-9]\d{9}$/;

const customerSchema = z.object({
  cname: z.string().min(1, 'Customer name is required').max(255, 'Name must be 255 characters or less'),
  mobile: z.string()
    .min(10, 'Mobile number must be 10 digits')
    .max(10, 'Mobile number must be 10 digits')
    .regex(mobileRegex, 'Please enter a valid mobile number'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  add1: z.string().max(255, 'Address line 1 must be 255 characters or less').optional(),
  add2: z.string().max(255, 'Address line 2 must be 255 characters or less').optional(),
  city: z.string().max(100, 'City must be 100 characters or less').optional(),
  state: z.string().max(100, 'State must be 100 characters or less').optional(),
  pincode: z.string()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits')
    .optional()
    .or(z.literal('')),
  rtype: z.enum(['regular', 'premium', 'vip'], {
    required_error: 'Please select customer type',
  }),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

const CustomerForm = ({ isOpen, onClose, customer }: CustomerFormProps) => {
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

  const isEditing = !!customer;
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      cname: '',
      mobile: '',
      email: '',
      add1: '',
      add2: '',
      city: '',
      state: '',
      pincode: '',
      rtype: 'regular',
    },
  });

  const selectedType = watch('rtype');

  useEffect(() => {
    if (customer) {
      setValue('cname', customer.cname);
      setValue('mobile', customer.mobile);
      setValue('email', customer.email || '');
      setValue('add1', customer.add1 || '');
      setValue('add2', customer.add2 || '');
      setValue('city', customer.city || '');
      setValue('state', customer.state || '');
      setValue('pincode', customer.pincode || '');
      setValue('rtype', customer.rtype);
    } else {
      reset();
    }
  }, [customer, setValue, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      // Clean up empty strings to undefined for optional fields
      const cleanData = {
        ...data,
        email: data.email || undefined,
        add1: data.add1 || undefined,
        add2: data.add2 || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        pincode: data.pincode || undefined,
      };

      if (isEditing && customer) {
        await updateCustomer({ id: customer.id, data: cleanData }).unwrap();
        toast.success('Customer updated successfully!');
      } else {
        await createCustomer(cleanData).unwrap();
        toast.success('Customer created successfully!');
      }
      onClose();
      reset();
    } catch (error) {
      toast.error((error as any)?.data?.error?.message || 'An error occurred');
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'premium':
        return '⭐';
      case 'vip':
        return '👑';
      default:
        return '👤';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? 'Edit Customer' : 'Create New Customer'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cname">Customer Name *</Label>
                <Input
                  id="cname"
                  {...register('cname')}
                  placeholder="Enter customer name"
                />
                {errors.cname && (
                  <p className="text-sm text-red-600">{errors.cname.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="mobile"
                    {...register('mobile')}
                    placeholder="9876543210"
                    className="pl-10"
                    maxLength={10}
                  />
                </div>
                {errors.mobile && (
                  <p className="text-sm text-red-600">{errors.mobile.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="customer@example.com"
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rtype">Customer Type *</Label>
                <Select value={selectedType} onValueChange={(value) => setValue('rtype', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">
                      <span className="flex items-center gap-2">
                        <span>👤</span>
                        <span>Regular</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="premium">
                      <span className="flex items-center gap-2">
                        <span>⭐</span>
                        <span>Premium</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="vip">
                      <span className="flex items-center gap-2">
                        <span>👑</span>
                        <span>VIP</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.rtype && (
                  <p className="text-sm text-red-600">{errors.rtype.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address Information
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add1">Address Line 1</Label>
                <Input
                  id="add1"
                  {...register('add1')}
                  placeholder="Street address, building name"
                />
                {errors.add1 && (
                  <p className="text-sm text-red-600">{errors.add1.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add2">Address Line 2</Label>
                <Input
                  id="add2"
                  {...register('add2')}
                  placeholder="Area, locality"
                />
                {errors.add2 && (
                  <p className="text-sm text-red-600">{errors.add2.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="City"
                  />
                  {errors.city && (
                    <p className="text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    {...register('state')}
                    placeholder="State"
                  />
                  {errors.state && (
                    <p className="text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    {...register('pincode')}
                    placeholder="123456"
                    maxLength={6}
                  />
                  {errors.pincode && (
                    <p className="text-sm text-red-600">{errors.pincode.message}</p>
                  )}
                </div>
              </div>
            </div>
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
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <span className="mr-2">{getTypeIcon(selectedType)}</span>
                  {isEditing ? 'Update Customer' : 'Create Customer'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerForm;