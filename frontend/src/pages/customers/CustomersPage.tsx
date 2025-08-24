import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Star, Crown, User as UserIcon, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CustomerForm from '@/components/forms/CustomerForm';
import {
  useGetCustomersQuery,
  useDeleteCustomerMutation,
  useToggleCustomerStatusMutation,
} from '@/store/api/customerApi';
import type { Customer } from '@/types';

const CustomersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const { data: customers = [], isLoading, error } = useGetCustomersQuery({ 
    search: searchTerm || undefined,
    rtype: customerTypeFilter !== 'all' ? (customerTypeFilter as 'regular' | 'premium' | 'vip') : undefined,
    is_active: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
  });
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();
  const [toggleStatus, { isLoading: isToggling }] = useToggleCustomerStatusMutation();

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    
    try {
      await deleteCustomer(deletingCustomer.id).unwrap();
      toast.success('Customer deleted successfully!');
      setDeletingCustomer(null);
    } catch (error) {
      toast.error((error as any)?.data?.error?.message || 'Failed to delete customer');
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    try {
      await toggleStatus(customer.id).unwrap();
      toast.success(`Customer ${customer.is_active ? 'deactivated' : 'activated'} successfully!`);
    } catch (error) {
      toast.error((error as any)?.data?.error?.message || 'Failed to update customer status');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  const getCustomerTypeIcon = (type: string) => {
    switch (type) {
      case 'premium':
        return <Star className="w-4 h-4 text-blue-500" />;
      case 'vip':
        return <Crown className="w-4 h-4 text-purple-500" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'premium':
        return 'bg-blue-100 text-blue-800';
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatMobile = (mobile: string) => {
    return mobile.replace(/(\d{5})(\d{5})/, '$1 $2');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">Error loading customers. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Customer Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Customers ({customers.length})</h2>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-6 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || customerTypeFilter !== 'all' || statusFilter !== 'all' 
                ? 'No customers found matching your filters.' 
                : 'Get started by creating your first customer.'}
            </p>
            {!searchTerm && customerTypeFilter === 'all' && statusFilter === 'all' && (
              <div className="mt-6">
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {customer.cname.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.cname}</div>
                          {customer.city && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {customer.city}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {formatMobile(customer.mobile)}
                      </div>
                      {customer.email && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {customer.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCustomerTypeColor(customer.rtype)}`}>
                        {getCustomerTypeIcon(customer.rtype)}
                        <span className="ml-1 capitalize">{customer.rtype}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.total_orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingCustomer(customer)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                          title="Edit Customer"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingCustomer(customer)}
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Form Dialog */}
      <CustomerForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        customer={editingCustomer}
      />

      {/* Customer Details Modal */}
      <Dialog open={!!viewingCustomer} onOpenChange={() => setViewingCustomer(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {viewingCustomer?.cname.charAt(0).toUpperCase()}
                </span>
              </div>
              {viewingCustomer?.cname}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                viewingCustomer ? getCustomerTypeColor(viewingCustomer.rtype) : ''
              }`}>
                {viewingCustomer && getCustomerTypeIcon(viewingCustomer.rtype)}
                <span className="ml-1 capitalize">{viewingCustomer?.rtype}</span>
              </span>
            </DialogTitle>
          </DialogHeader>
          
          {viewingCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm text-gray-900 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {formatMobile(viewingCustomer.mobile)}
                  </p>
                </div>
                {viewingCustomer.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {viewingCustomer.email}
                    </p>
                  </div>
                )}
              </div>

              {(viewingCustomer.add1 || viewingCustomer.city) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <div className="text-sm text-gray-900">
                    {viewingCustomer.add1 && <p>{viewingCustomer.add1}</p>}
                    {viewingCustomer.add2 && <p>{viewingCustomer.add2}</p>}
                    {(viewingCustomer.city || viewingCustomer.state || viewingCustomer.pincode) && (
                      <p>
                        {[viewingCustomer.city, viewingCustomer.state, viewingCustomer.pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Orders</label>
                  <p className="text-lg font-semibold text-gray-900">{viewingCustomer.total_orders}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Spent</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(viewingCustomer.total_spent)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <p className="text-sm text-gray-900">{new Date(viewingCustomer.created_at).toLocaleDateString()}</p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant={viewingCustomer.is_active ? "outline" : "default"}
                  onClick={() => handleToggleStatus(viewingCustomer)}
                  disabled={isToggling}
                >
                  {viewingCustomer.is_active ? 'Deactivate' : 'Activate'} Customer
                </Button>
                <Button onClick={() => handleEdit(viewingCustomer)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Customer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCustomer} onOpenChange={() => setDeletingCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingCustomer?.cname}"? 
              This action cannot be undone and will remove all associated order history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCustomer(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;