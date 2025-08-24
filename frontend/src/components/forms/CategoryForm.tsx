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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from '@/store/api/categoryApi';
import type { Category } from '@/types';

const categorySchema = z.object({
  catid: z.string().min(1, 'Category ID is required').max(50, 'Category ID must be 50 characters or less'),
  category: z.string().min(1, 'Category name is required').max(255, 'Category name must be 255 characters or less'),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
}

const CategoryForm = ({ isOpen, onClose, category }: CategoryFormProps) => {
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  const isEditing = !!category;
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      catid: '',
      category: '',
      description: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (category) {
      setValue('catid', category.catid);
      setValue('category', category.category);
      setValue('description', category.description || '');
      setValue('is_active', category.is_active);
    } else {
      reset();
    }
  }, [category, setValue, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditing && category) {
        await updateCategory({ id: category.id, data }).unwrap();
        toast.success('Category updated successfully!');
      } else {
        await createCategory(data).unwrap();
        toast.success('Category created successfully!');
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Category' : 'Create New Category'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="catid">Category ID</Label>
            <Input
              id="catid"
              {...register('catid')}
              disabled={isEditing} // Don't allow editing category ID
              placeholder="e.g., DRY_CLEAN"
            />
            {errors.catid && (
              <p className="text-sm text-red-600">{errors.catid.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category Name</Label>
            <Input
              id="category"
              {...register('category')}
              placeholder="e.g., Dry Cleaning"
            />
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="Optional description"
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
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
                isEditing ? 'Update Category' : 'Create Category'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;