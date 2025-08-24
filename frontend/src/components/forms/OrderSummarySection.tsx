import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { ArrowLeft, User, Package, CreditCard, Calendar, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Removed form components - using regular inputs instead
import type { Customer } from "@/types";

interface OrderItem {
  id: string;
  service_id: number;
  service_name: string;
  quantity: number;
  rate: number;
  amount: number;
  notes?: string;
}

interface OrderTotals {
  subtotal: number;
  discountAmount: number;
  afterDiscount: number;
  taxAmount: number;
  total: number;
  remaining: number;
}

interface OrderSummarySectionProps {
  form: UseFormReturn<any>;
  selectedCustomer: Customer | null;
  orderItems: OrderItem[];
  totals: OrderTotals;
  loading: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

const OrderSummarySection: React.FC<OrderSummarySectionProps> = ({
  form,
  selectedCustomer,
  orderItems,
  totals,
  loading,
  onSubmit,
  onBack,
}) => {
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="space-y-8">
      {/* Customer Summary */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl">Customer Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {selectedCustomer ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="text-lg font-semibold text-foreground">{selectedCustomer.cname}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Mobile</Label>
                <p className="text-lg font-semibold text-foreground">{selectedCustomer.mobile}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                <p className="text-lg text-foreground">{selectedCustomer.add1 || "Not provided"}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No customer selected</p>
          )}
        </CardContent>
      </Card>

      {/* Order Items Summary */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Order Items</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{orderItems.length} {orderItems.length === 1 ? 'item' : 'items'} selected</p>
              </div>
            </div>
            <div className="bg-primary/10 rounded-lg px-3 py-1">
              <p className="text-sm font-semibold text-primary">
                ₹{totals.subtotal.toFixed(2)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-muted/50 to-card rounded-lg border hover:shadow-sm transition-all"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{item.service_name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="text-sm text-muted-foreground">Rate: ₹{item.rate.toFixed(2)}</span>
                    {item.notes && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="text-sm text-muted-foreground/70">{item.notes}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    ₹{item.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-4 mt-4 bg-primary/10 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">Subtotal:</span>
                <span className="text-2xl font-bold text-primary">₹{totals.subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details & Pricing */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary rounded-lg">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Final Details & Pricing</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Set delivery date, pricing adjustments, and create order</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-8">
          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="flex items-center space-x-1 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                <span>Due Date *</span>
              </Label>
              <Input
                type="date"
                value={form.watch("due_date") || ""}
                onChange={(e) => form.setValue("due_date", e.target.value)}
                min={getTodayDate()}
                disabled={loading}
                className="mt-1"
              />
              {form.formState.errors.due_date && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.due_date?.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Priority</Label>
              <select
                value={form.watch("priority") || "normal"}
                onChange={(e) => form.setValue("priority", e.target.value as any)}
                disabled={loading}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              {form.formState.errors.priority && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.priority?.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <Label className="flex items-center space-x-1 text-sm font-medium">
                <FileText className="w-4 h-4" />
                <span>Order Notes</span>
              </Label>
              <Input
                value={form.watch("notes") || ""}
                onChange={(e) => form.setValue("notes", e.target.value)}
                placeholder="Special instructions..."
                disabled={loading}
                className="mt-1"
              />
              {form.formState.errors.notes && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.notes?.message?.toString()}
                </p>
              )}
            </div>
          </div>

          {/* Pricing Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Discount (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.watch("discount_percentage") || 0}
                onChange={(e) => form.setValue("discount_percentage", parseFloat(e.target.value) || 0)}
                disabled={loading}
                className="mt-1"
              />
              {form.formState.errors.discount_percentage && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.discount_percentage?.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Tax (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.watch("tax_percentage") || 0}
                onChange={(e) => form.setValue("tax_percentage", parseFloat(e.target.value) || 0)}
                disabled={loading}
                className="mt-1"
              />
              {form.formState.errors.tax_percentage && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.tax_percentage?.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Advance Paid</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.watch("advance_paid") || 0}
                onChange={(e) => form.setValue("advance_paid", parseFloat(e.target.value) || 0)}
                disabled={loading}
                className="mt-1"
              />
              {form.formState.errors.advance_paid && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.advance_paid?.message?.toString()}
                </p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8 border-2 border-primary/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Order Summary</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold text-foreground">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount ({form.watch("discount_percentage")}%):</span>
                  <span className="font-semibold">-₹{totals.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">After Discount:</span>
                <span className="font-semibold text-foreground">₹{totals.afterDiscount.toFixed(2)}</span>
              </div>
              
              {totals.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({form.watch("tax_percentage")}%):</span>
                  <span className="font-semibold text-foreground">₹{totals.taxAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t-2 border-primary/20 pt-4">
                <div className="flex justify-between text-2xl font-bold">
                  <span className="text-foreground">Total Amount:</span>
                  <span className="text-primary">₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
              
              {form.watch("advance_paid") > 0 && (
                <div className="bg-background/60 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Advance Paid:</span>
                    <span className="font-semibold text-primary">₹{form.watch("advance_paid").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-foreground">Remaining Amount:</span>
                    <span className="text-orange-600 dark:text-orange-400">₹{totals.remaining.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-8 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Review Items</span>
            </Button>
            
            <Button
              type="button"
              onClick={onSubmit}
              disabled={loading || !selectedCustomer || orderItems.length === 0 || !form.watch("due_date")}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white px-12 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Order...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSummarySection;