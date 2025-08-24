import React, { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
 

interface ServiceItem {
  service_id: number;
  iname: string;
  rate: number;
  quantity: number;
  notes?: string;
}

interface ModernTotalInvoiceProps {
  form: UseFormReturn<any>;
  loading: boolean;
  addedServices: ServiceItem[];
  removeServices: (index: number) => void;
}

const ModernTotalInvoice: React.FC<ModernTotalInvoiceProps> = ({
  form,
  loading,
  addedServices,
  removeServices,
}) => {
  const calculateTotalAmountForForm = () => {
    const totalAmount = addedServices.reduce(
      (total: number, service: ServiceItem) =>
        total + parseFloat(String(service.rate || 0)) * parseFloat(String(service.quantity || 0)),
      0
    );
    form.setValue("totalAmount", totalAmount);
    return totalAmount;
  };

  useEffect(() => {
    calculateTotalAmountForForm();
  }, [addedServices]);

  const calculateTotals = () => {
    const discountPercentage = parseFloat(String(form.getValues("discount_percentage") || "0"));
    const taxPercentage = parseFloat(String(form.getValues("tax_percentage") || "0"));
    const advancePaid = parseFloat(String(form.getValues("advance_paid") || "0"));
    const subtotal = calculateTotalAmountForForm();

    const discountAmount = (subtotal * discountPercentage) / 100;
    const totalAfterDiscount = subtotal - discountAmount;
    const taxAmount = (totalAfterDiscount * taxPercentage) / 100;
    const totalAfterTax = totalAfterDiscount + taxAmount;
    const remainingAmount = Math.max(0, totalAfterTax - advancePaid);

    return {
      subtotal,
      discountAmount,
      totalAfterDiscount,
      taxAmount,
      totalAfterTax,
      remainingAmount,
    };
  };

  const totals = calculateTotals();

  useEffect(() => {
    // Update calculated fields in the form
    form.setValue("totalAfterDiscount", totals.totalAfterDiscount);
    form.setValue("totalAfterGST", totals.totalAfterTax);
    form.setValue("remainingAmount", totals.remainingAmount);
  }, [
    addedServices,
    form.watch("discount_percentage"),
    form.watch("tax_percentage"),
    form.watch("advance_paid"),
  ]);

  const renderServicesTable = () => {
    return (
      <ScrollArea className="h-72">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
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
            {addedServices.map((service: ServiceItem, index: number) => (
              <tr key={`${service.service_id}-${index}`}>
                <td className="px-6 py-4 whitespace-nowrap">{service.iname}</td>
                <td className="px-6 py-4 whitespace-nowrap">₹{service.rate}</td>
                <td className="px-6 py-4 whitespace-nowrap">{service.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-wrap">{service.notes || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button
                    onClick={() => removeServices(index)}
                    disabled={loading}
                    variant="destructive"
                    size="sm"
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
            {addedServices.length > 0 && (
              <tr className="bg-gray-100">
                <td colSpan={2} className="px-6 py-4 text-right">
                  <strong>Subtotal:</strong>
                </td>
                <td colSpan={3} className="px-6 py-4 whitespace-nowrap">
                  <strong>₹{totals.subtotal.toFixed(2)}</strong>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollArea>
    );
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">Invoice Details</h1>
      
      {/* Services Table */}
      {renderServicesTable()}
      
      {/* Financial Details Form */}
      <form className="space-y-4 mt-6">
        <div className="grid grid-cols-1 gap-y-4 gap-x-8 sm:grid-cols-2 md:grid-cols-3">
          <FormField
            control={form.control}
            name="discount_percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount (%)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={loading}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Discount Percentage"
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tax_percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax (%)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={loading}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Tax Percentage"
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="advance_paid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Advance Paid</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={loading}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Advance Paid"
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={loading}
                    type="date"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={loading}
                    placeholder="Order notes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Summary Section */}
        <div className="bg-gray-50 p-4 rounded-md space-y-2 mt-6">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{totals.subtotal.toFixed(2)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-₹{totals.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>After Discount:</span>
            <span>₹{totals.totalAfterDiscount.toFixed(2)}</span>
          </div>
          {totals.taxAmount > 0 && (
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>₹{totals.taxAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total:</span>
            <span>₹{totals.totalAfterTax.toFixed(2)}</span>
          </div>
          {form.getValues("advance_paid") > 0 && (
            <>
              <div className="flex justify-between">
                <span>Advance Paid:</span>
                <span>₹{form.getValues("advance_paid")}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Remaining:</span>
                <span>₹{totals.remainingAmount.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default ModernTotalInvoice;