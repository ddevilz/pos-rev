import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Package, Clock, CheckCircle, Truck, XCircle, Calendar, User } from 'lucide-react';
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
import OrderForm from '@/components/forms/OrderForm';
import {
  useGetOrdersQuery,
  useDeleteOrderMutation,
  useUpdateOrderStatusMutation,
} from '@/store/api/orderApi';
import type { Order } from '@/types';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading, error } = useGetOrdersQuery({ 
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
    priority: priorityFilter !== 'all' ? (priorityFilter as any) : undefined,
    payment_status: paymentStatusFilter !== 'all' ? (paymentStatusFilter as any) : undefined,
    limit: 100,
  });
  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;
    
    try {
      await deleteOrder(deletingOrder.id).unwrap();
      toast.success('Order deleted successfully!');
      setDeletingOrder(null);
    } catch (error) {
      toast.error((error as any)?.data?.error?.message || 'Failed to delete order');
    }
  };

  const handleStatusUpdate = async (order: Order, newStatus: string) => {
    if (newStatus === order.status) return;
    
    try {
      await updateOrderStatus({ 
        id: order.id, 
        data: { status: newStatus as any } 
      }).unwrap();
      toast.success(`Order status updated to ${newStatus}!`);
    } catch (error) {
      toast.error((error as any)?.data?.error?.message || 'Failed to update order status');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingOrder(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'in_progress':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'delivered':
        return <Truck className="w-4 h-4 text-purple-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-gray-100 text-gray-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      case 'refunded':
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">Error loading orders. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders and track their progress</p>
        </div>
        <Button onClick={() => navigate('/orders/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Order
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Orders ({orders.length})</h2>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || paymentStatusFilter !== 'all'
                ? 'No orders found matching your filters.' 
                : 'Get started by creating your first order.'}
            </p>
            {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && paymentStatusFilter === 'all' && (
              <div className="mt-6">
                <Button onClick={() => navigate('/orders/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Order
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
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(order.created_at)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.total_quantity} items
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{order.customer?.cname ?? '-'}</div>
                          <div className="text-sm text-gray-500">{order.customer?.mobile ?? '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                        {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(order.total_amount)}</div>
                      {order.advance_paid > 0 && (
                        <div className="text-xs text-gray-500">
                          Advance: {formatCurrency(order.advance_paid)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.due_date ? formatDate(order.due_date) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingOrder(order)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(order)}
                          title="Edit Order"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingOrder(order)}
                          title="Delete Order"
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

      {/* Order Form Dialog */}
      <OrderForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        order={editingOrder}
      />

      {/* Order Details Modal */}
      <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {viewingOrder?.order_number}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                viewingOrder ? getStatusColor(viewingOrder.status) : ''
              }`}>
                {viewingOrder && getStatusIcon(viewingOrder.status)}
                <span className="ml-1 capitalize">{viewingOrder?.status.replace('_', ' ')}</span>
              </span>
            </DialogTitle>
          </DialogHeader>
          
          {viewingOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="text-sm text-gray-900">{viewingOrder.customer?.cname ?? '-'}</p>
                  <p className="text-sm text-gray-500">{viewingOrder.customer?.mobile ?? '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(viewingOrder.priority)}`}>
                    {viewingOrder.priority.charAt(0).toUpperCase() + viewingOrder.priority.slice(1)}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Date</label>
                  <p className="text-sm text-gray-900">{formatDate(viewingOrder.created_at)}</p>
                </div>
                {viewingOrder.due_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Due Date</label>
                    <p className="text-sm text-gray-900">{formatDate(viewingOrder.due_date)}</p>
                  </div>
                )}
                {viewingOrder.delivery_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Delivery Date</label>
                    <p className="text-sm text-gray-900">{formatDate(viewingOrder.delivery_date)}</p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              {viewingOrder.items && viewingOrder.items.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Items</label>
                  <div className="mt-2 border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Service</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Rate</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {viewingOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.service_name}</td>
                            <td className="px-4 py-2 text-center text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-2 text-right text-sm text-gray-900">{formatCurrency(item.rate)}</td>
                            <td className="px-4 py-2 text-right text-sm text-gray-900">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Subtotal:</span>
                    <span className="text-sm text-gray-900">{formatCurrency(viewingOrder.subtotal)}</span>
                  </div>
                  {viewingOrder.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Discount ({viewingOrder.discount_percentage}%):</span>
                      <span className="text-sm text-gray-900">-{formatCurrency(viewingOrder.discount_amount)}</span>
                    </div>
                  )}
                  {viewingOrder.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Tax ({viewingOrder.tax_percentage}%):</span>
                      <span className="text-sm text-gray-900">{formatCurrency(viewingOrder.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span className="text-sm text-gray-900">Total:</span>
                    <span className="text-sm text-gray-900">{formatCurrency(viewingOrder.total_amount)}</span>
                  </div>
                  {viewingOrder.advance_paid > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Advance Paid:</span>
                        <span className="text-sm text-gray-900">{formatCurrency(viewingOrder.advance_paid)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-sm text-gray-900">Remaining:</span>
                        <span className="text-sm text-gray-900">{formatCurrency(viewingOrder.remaining_amount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Status Update */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-2">
                  {viewingOrder.status !== 'cancelled' && (
                    <>
                      {viewingOrder.status !== 'in_progress' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(viewingOrder, 'in_progress')}
                          disabled={isUpdatingStatus}
                        >
                          Start Processing
                        </Button>
                      )}
                      {viewingOrder.status !== 'completed' && viewingOrder.status === 'in_progress' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(viewingOrder, 'completed')}
                          disabled={isUpdatingStatus}
                        >
                          Mark Complete
                        </Button>
                      )}
                      {viewingOrder.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(viewingOrder, 'delivered')}
                          disabled={isUpdatingStatus}
                        >
                          Mark Delivered
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <Button onClick={() => handleEdit(viewingOrder)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Order
                </Button>
              </div>

              {viewingOrder.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-sm text-gray-900 mt-1">{viewingOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingOrder} onOpenChange={() => setDeletingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete order "{deletingOrder?.order_number}"? 
              This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingOrder(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;