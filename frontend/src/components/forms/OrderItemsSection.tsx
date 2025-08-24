import React, { useState } from "react";
import { Trash2, Edit3, Check, X, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OrderItem {
  id: string;
  service_id: number;
  service_name: string;
  quantity: number;
  rate: number;
  amount: number;
  notes?: string;
}

interface OrderItemsSectionProps {
  items: OrderItem[];
  onItemUpdate: (id: string, updates: Partial<OrderItem>) => void;
  onItemRemove: (id: string) => void;
  loading: boolean;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  items,
  onItemUpdate,
  onItemRemove,
  loading,
}) => {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    quantity: number;
    rate: number;
    notes: string;
  }>({
    quantity: 1,
    rate: 0,
    notes: "",
  });

  const handleEditStart = (item: OrderItem) => {
    setEditingItem(item.id);
    setEditValues({
      quantity: item.quantity,
      rate: item.rate,
      notes: item.notes || "",
    });
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditValues({ quantity: 1, rate: 0, notes: "" });
  };

  const handleEditSave = () => {
    if (editingItem) {
      onItemUpdate(editingItem, {
        quantity: editValues.quantity,
        rate: editValues.rate,
        notes: editValues.notes,
        amount: editValues.quantity * editValues.rate,
      });
      setEditingItem(null);
      setEditValues({ quantity: 1, rate: 0, notes: "" });
    }
  };

  const handleRemove = (id: string) => {
    if (window.confirm("Are you sure you want to remove this item from the order?")) {
      onItemRemove(id);
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.amount, 0);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items Added</h3>
        <p className="text-gray-600">
          Go back to the Services tab to add items to your order
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.service_name}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingItem === item.id ? (
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={editValues.quantity}
                      onChange={(e) => setEditValues(prev => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 1
                      }))}
                      className="w-20"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{item.quantity}</div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingItem === item.id ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editValues.rate}
                      onChange={(e) => setEditValues(prev => ({
                        ...prev,
                        rate: parseFloat(e.target.value) || 0
                      }))}
                      className="w-24"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">₹{item.rate.toFixed(2)}</div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-green-600">
                    ₹{editingItem === item.id ? 
                      (editValues.quantity * editValues.rate).toFixed(2) : 
                      item.amount.toFixed(2)
                    }
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  {editingItem === item.id ? (
                    <Input
                      value={editValues.notes}
                      onChange={(e) => setEditValues(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                      placeholder="Add notes..."
                      className="w-32"
                    />
                  ) : (
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {item.notes || "-"}
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingItem === item.id ? (
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleEditSave}
                        disabled={loading}
                        className="flex items-center space-x-1"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleEditCancel}
                        disabled={loading}
                        className="flex items-center space-x-1"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditStart(item)}
                        disabled={loading || editingItem !== null}
                        className="flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemove(item.id)}
                        disabled={loading}
                        className="flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {/* Total Row */}
            <tr className="bg-gray-50 font-medium">
              <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                Subtotal:
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-green-600">
                  ₹{calculateTotal().toFixed(2)}
                </div>
              </td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {editingItem && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-blue-800">
            <Edit3 className="w-4 h-4" />
            <span className="text-sm font-medium">
              Editing item - make your changes and click the checkmark to save
            </span>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p>
          <strong>Tips:</strong>
        </p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Click the edit icon to modify quantity, rate, or notes</li>
          <li>Click the trash icon to remove an item from the order</li>
          <li>Changes to quantity or rate will automatically update the amount</li>
        </ul>
      </div>
    </div>
  );
};

export default OrderItemsSection;