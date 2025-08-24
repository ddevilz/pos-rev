import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useCreateServiceMutation,
  useUpdateServiceMutation,
} from '@/store/api/serviceApi';
import { useGetCategoriesQuery } from '@/store/api/categoryApi';
import type { Service } from '@/types';

const serviceSchema = z.object({
  ino: z.number().optional(),
  iname: z.string().min(1, 'Service name is required').max(255, 'Service name must be 255 characters or less'),
  description: z.string().optional(),
  category_id: z.number().optional(),
  rate1: z.number().min(0, 'Rate must be positive').default(0),
  rate2: z.number().min(0, 'Rate must be positive').default(0),
  rate3: z.number().min(0, 'Rate must be positive').default(0),
  rate4: z.number().min(0, 'Rate must be positive').default(0),
  rate5: z.number().min(0, 'Rate must be positive').default(0),
  itype: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service | null;
}

const ServiceForm = ({ isOpen, onClose, service }: ServiceFormProps) => {
  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();
  const { data: categories = [] } = useGetCategoriesQuery({ is_active: true });

  const isEditing = !!service;
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      ino: undefined,
      iname: '',
      description: '',
      category_id: undefined,
      rate1: 0,
      rate2: 0,
      rate3: 0,
      rate4: 0,
      rate5: 0,
      itype: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (service) {
      setValue('ino', service.ino || undefined);
      setValue('iname', service.iname);
      setValue('description', service.description || '');
      setValue('category_id', service.category_id || undefined);
      setValue('rate1', service.rate1);
      setValue('rate2', service.rate2 || 0);
      setValue('rate3', service.rate3 || 0);
      setValue('rate4', service.rate4 || 0);
      setValue('rate5', service.rate5 || 0);
      setValue('itype', service.itype || '');
      setValue('is_active', service.is_active);
    } else {
      reset();
    }
  }, [service, setValue, reset]);

  const onSubmit = async (data: ServiceFormData) => {
    try {
      if (isEditing && service) {
        await updateService({ id: service.id, data }).unwrap();
        toast.success('Service updated successfully!');
      } else {
        await createService(data).unwrap();
        toast.success('Service created successfully!');
      }
      onClose();
      reset();
    } catch (error: any) {
      toast.error(error?.data?.error?.message || 'An error occurred');
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Service' : 'Create New Service'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ino">Service Number (Optional)</Label>
              <Input
                id="ino"
                type="number"
                {...register('ino', { valueAsNumber: true })}
                placeholder="e.g., 001"
              />
              {errors.ino && (
                <p className="text-sm text-red-600">{errors.ino.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select
                value={watch('category_id')?.toString() || ''}
                onValueChange={(value) => setValue('category_id', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iname">Service Name</Label>
            <Input
              id="iname"
              {...register('iname')}
              placeholder="e.g., Shirt Dry Clean"
            />
            {errors.iname && (
              <p className="text-sm text-red-600">{errors.iname.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="Optional description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="itype">Service Type</Label>
            <Input
              id="itype"
              {...register('itype')}
              placeholder="e.g., Premium, Regular"
            />
          </div>

          {/* Pricing Rates */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Pricing Rates</Label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate1">Rate 1</Label>
                <Input
                  id="rate1"
                  type="number"
                  step="0.01"
                  {...register('rate1', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.rate1 && (
                  <p className="text-sm text-red-600">{errors.rate1.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate2">Rate 2</Label>
                <Input
                  id="rate2"
                  type="number"
                  step="0.01"
                  {...register('rate2', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.rate2 && (
                  <p className="text-sm text-red-600">{errors.rate2.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate3">Rate 3</Label>
                <Input
                  id="rate3"
                  type="number"
                  step="0.01"
                  {...register('rate3', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.rate3 && (
                  <p className="text-sm text-red-600">{errors.rate3.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate4">Rate 4</Label>
                <Input
                  id="rate4"
                  type="number"
                  step="0.01"
                  {...register('rate4', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.rate4 && (
                  <p className="text-sm text-red-600">{errors.rate4.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate5">Rate 5</Label>
                <Input
                  id="rate5"
                  type="number"
                  step="0.01"
                  {...register('rate5', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.rate5 && (
                  <p className="text-sm text-red-600">{errors.rate5.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_active">Active</Label>
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
                isEditing ? 'Update Service' : 'Create Service'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceForm;