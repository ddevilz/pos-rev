import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomerSearchSection from "@/components/forms/CustomerSearchSection";
import ServiceSelectionSection from "@/components/forms/ServiceSelectionSection";
import OrderItemsSection from "@/components/forms/OrderItemsSection";
import OrderSummarySection from "@/components/forms/OrderSummarySection";

import { useCreateOrderMutation } from "@/store/api/orderApi";
import { useCreateCustomerMutation } from "@/store/api/customerApi";
import type { Customer, Service } from "@/types";
import { User, Package } from "lucide-react";
import OrderReceipt from "@/components/print/OrderReceipt";
import { printElementById } from "@/lib/print";
import type { Order as ApiOrder } from "@/types";

// Order item type for the form
interface OrderItem {
  id: string; // temporary ID for form management
  service_id: number;
  service_name: string;
  quantity: number;
  rate: number;
  amount: number;
  notes?: string;
}

// Order form schema
const orderFormSchema = z.object({
  // Customer info
  customer_id: z.number(),
  customer_name: z.string().min(1, "Customer name is required"),
  customer_mobile: z.string().min(10, "Mobile number is required"),
  customer_address: z.string().optional(),
  
  // Order details
  due_date: z.string().min(1, "Due date is required"),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  notes: z.string().optional(),
  
  // Financial details
  discount_percentage: z.number().min(0).max(100).default(0),
  tax_percentage: z.number().min(0).max(100).default(0),
  advance_paid: z.number().min(0).default(0),
  
  // Order items (we'll manage this separately for better UX)
  items: z.array(z.object({
    service_id: z.number(),
    service_name: z.string(),
    quantity: z.number().min(1),
    rate: z.number().min(0),
    amount: z.number().min(0),
    notes: z.string().optional(),
  })).min(1, "At least one service is required"),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

const NewOrderPage: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("customer");
  const [printOrder, setPrintOrder] = useState<ApiOrder | null>(null);

  const [createOrder] = useCreateOrderMutation();
  const [createCustomer] = useCreateCustomerMutation();
  const { selectedRate } = useSelector((state: RootState) => state.rate);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customer_id: 0,
      customer_name: "",
      customer_mobile: "",
      customer_address: "",
      due_date: "",
      priority: "normal",
      notes: "",
      discount_percentage: 0,
      tax_percentage: 0,
      advance_paid: 0,
      items: [],
    },
  });

  // Debug form errors
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      const errorMessages = Object.entries(form.formState.errors).map(([field, error]) => {
        if (error && typeof error === 'object' && 'message' in error) {
          return `${field}: ${error.message}`;
        }
        return field;
      });

      toast.error(`Form validation errors:\n${errorMessages.join('\n')}`);
    }
  }, [form.formState.errors]);

  // Keep form items in sync with orderItems state
  useEffect(() => {
    const formItems = orderItems.map(item => ({
      service_id: item.service_id,
      service_name: item.service_name,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
      notes: item.notes || undefined,
    }));
    form.setValue("items", formItems as any);
  }, [orderItems, form]);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const discountPercentage = Number(form.watch("discount_percentage")) || 0;
    const taxPercentage = Number(form.watch("tax_percentage")) || 0;
    const advancePaid = Number(form.watch("advance_paid")) || 0;
    
    const discountAmount = (subtotal * discountPercentage) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxPercentage) / 100;
    const total = afterDiscount + taxAmount;
    const remaining = Math.max(0, total - advancePaid);

    return {
      subtotal,
      discountAmount,
      afterDiscount,
      taxAmount,
      total,
      remaining,
    };
  };

  const totals = calculateTotals();

  // When a new order is created, render receipt and auto-print once, then reset form/state
  useEffect(() => {
    if (!printOrder) return;
    let cancelled = false;
    const run = async () => {
      // Wait for receipt to mount
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      if (cancelled) return;
      await printElementById("printable-receipt");

      // After printing, reset everything
      form.reset();
      setSelectedCustomer(null);
      setOrderItems([]);
      setActiveTab("customer");
      setPrintOrder(null);
    };
    run();
    return () => { cancelled = true; };
  }, [printOrder]);

  // Handle customer selection/creation
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.setValue("customer_id", customer.id);
    form.setValue("customer_name", customer.cname);
    form.setValue("customer_mobile", customer.mobile);
    form.setValue("customer_address", customer.add1 || "");
  };

  const handleCustomerCreate = async (customerData: {
    cname: string;
    mobile: string;
    add1?: string;
  }) => {
    try {
      const newCustomer = await createCustomer({
        ...customerData,
        rtype: 'regular' as const,
      }).unwrap();
      
      handleCustomerSelect(newCustomer);
      toast.success("Customer created successfully!");
      return newCustomer;
    } catch (error: any) {
      toast.error(error?.data?.error?.message || "Failed to create customer");
      throw error;
    }
  };

  // Handle service selection
  const handleServiceAdd = (service: Service, quantity: number = 1, notes: string = "") => {
    const rate = Number(service[selectedRate] || service.rate1 || 0);
    const qty = Number(quantity);
    const amount = qty * rate;
    
    const newItem: OrderItem = {
      id: Date.now().toString(), // temporary ID
      service_id: service.id,
      service_name: service.iname,
      quantity: qty,
      rate: rate,
      amount: amount,
      notes,
    };

    setOrderItems(prev => [...prev, newItem]);
    toast.success(`${service.iname} added to order`);
  };

  // Handle order item updates
  const handleItemUpdate = (id: string, updates: Partial<OrderItem>) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        // Ensure numbers are properly converted
        if ('quantity' in updates) {
          updated.quantity = Number(updates.quantity) || 1;
        }
        if ('rate' in updates) {
          updated.rate = Number(updates.rate) || 0;
        }
        // Recalculate amount if quantity or rate changed
        if ('quantity' in updates || 'rate' in updates) {
          updated.amount = Number(updated.quantity) * Number(updated.rate);
        }
        return updated;
      }
      return item;
    }));
  };

  const handleItemRemove = (id: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  // Handle form submission
  const onSubmit = async (data: OrderFormData) => {
    setLoading(true);

    try {
      if (orderItems.length === 0) {
        toast.warning("Please add at least one service to the order.");
        setLoading(false);
        return;
      }

      let customerId = data.customer_id;

      // Create customer if needed
      if (customerId === 0) {
        const newCustomer = await handleCustomerCreate({
          cname: data.customer_name,
          mobile: data.customer_mobile,
          add1: data.customer_address,
        });
        customerId = newCustomer.id;
      }

      // Update form items before submission
      const apiItems = orderItems.map(item => ({
        service_id: item.service_id,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        notes: item.notes || undefined,
      }));

      // Prepare order data in the format expected by the API
      const orderData = {
        customer_id: customerId,
        due_date: data.due_date,
        priority: data.priority,
        discount_percentage: data.discount_percentage,
        tax_percentage: data.tax_percentage,
        advance_paid: data.advance_paid,
        notes: data.notes || undefined,
        items: apiItems,
      };
      
      const result = await createOrder(orderData).unwrap();
      
      toast.success(`Order ${result.order_number} created successfully!`);
      // Set for printing; cleanup/reset happens after printing via useEffect
      setPrintOrder(result as ApiOrder);
      
    } catch (error: any) {
      console.error("Order creation error:", error);
      toast.error(error?.data?.error?.message || error?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = selectedCustomer && orderItems.length > 0 && form.watch("due_date");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create New Order</h1>
          <p className="text-muted-foreground mt-2">Manage customers, select services, and create orders</p>
        </div>

        {/* Customer Info Header - Always Visible */}
        {selectedCustomer && (
          <Card className="mb-6 shadow-sm border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{selectedCustomer.cname}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <p className="text-muted-foreground font-medium">{selectedCustomer.mobile}</p>
                      {selectedCustomer.add1 && (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.add1}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-primary/10 rounded-lg px-4 py-2">
                    <p className="text-sm font-medium text-primary">Items: {orderItems.length}</p>
                    <p className="text-xl font-bold text-primary">
                      ₹{totals.subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Enhanced Tab Navigation */}
          <div className="bg-card rounded-lg shadow-sm border p-2">
            <TabsList className="grid grid-cols-4 w-full h-12 bg-muted/50">
              <TabsTrigger 
                value="customer" 
                className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <User className="w-4 h-4 mr-2" />
                Customer
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                disabled={!selectedCustomer}
                className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm disabled:opacity-40"
              >
                <Package className="w-4 h-4 mr-2" />
                Services
              </TabsTrigger>
              <TabsTrigger 
                value="review" 
                disabled={orderItems.length === 0}
                className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm disabled:opacity-40"
              >
                <Package className="w-4 h-4 mr-2" />
                Review
              </TabsTrigger>
              <TabsTrigger 
                value="summary" 
                disabled={!isFormValid}
                className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm disabled:opacity-40"
              >
                <Package className="w-4 h-4 mr-2" />
                Summary
              </TabsTrigger>
            </TabsList>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log('🚫 Form validation failed before onSubmit:', errors);
          })}>
            <TabsContent value="customer" className="space-y-6 mt-0">
              <Card className="shadow-sm border">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Customer Information</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Search for existing customers or create a new one</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CustomerSearchSection
                    form={form}
                    selectedCustomer={selectedCustomer}
                    onCustomerSelect={handleCustomerSelect}
                    onCustomerCreate={handleCustomerCreate}
                    loading={loading}
                  />
                  
                  {selectedCustomer && (
                    <div className="mt-8 pt-6 border-t border-border">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 text-primary">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm font-medium">Customer selected</span>
                        </div>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab("services")}
                          className="px-8"
                        >
                          Next: Select Services →
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Service Selection */}
                <Card className="shadow-sm border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-secondary rounded-lg">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Add Services</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Select categories and services to add to the order
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ServiceSelectionSection
                      onServiceAdd={handleServiceAdd}
                      selectedRate={selectedRate}
                      loading={loading}
                    />
                  </CardContent>
                </Card>

                {/* Current Order Items */}
                <Card className="shadow-sm border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-secondary rounded-lg">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Current Order</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {orderItems.length} {orderItems.length === 1 ? 'item' : 'items'} added
                          </p>
                        </div>
                      </div>
                      {orderItems.length > 0 && (
                        <div className="bg-primary/10 rounded-lg px-3 py-1">
                          <p className="text-sm font-semibold text-primary">
                            ₹{totals.subtotal.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {orderItems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="font-medium">No services added yet</p>
                        <p className="text-sm">Select services from the left panel to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {orderItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border hover:bg-muted transition-colors"
                          >
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{item.service_name}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                                <span className="text-muted-foreground/50">•</span>
                                <span className="text-sm text-muted-foreground">Rate: ₹{Number(item.rate).toFixed(2)}</span>
                                {item.notes && (
                                  <>
                                    <span className="text-muted-foreground/50">•</span>
                                    <span className="text-sm text-muted-foreground/70">{item.notes}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <p className="font-bold text-primary">
                                  ₹{Number(item.amount).toFixed(2)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleItemRemove(item.id)}
                                className="h-8 w-8 p-0 rounded-full"
                                title="Remove item"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        <div className="border-t pt-4 mt-4 bg-primary/10 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-foreground">Subtotal:</span>
                            <span className="text-xl font-bold text-primary">₹{totals.subtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            
              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setActiveTab("customer")}
                  className="px-6"
                >
                  ← Back to Customer
                </Button>
                {orderItems.length > 0 && (
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("review")}
                    className="px-8"
                  >
                    Review Order →
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="review" className="space-y-6 mt-0">
              <Card className="shadow-sm border">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-secondary rounded-lg">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Review Order</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Review items, edit quantities, and add special instructions
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <OrderItemsSection
                    items={orderItems}
                    onItemUpdate={handleItemUpdate}
                    onItemRemove={handleItemRemove}
                    loading={loading}
                  />
                  
                  {/* Order Notes Section */}
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
                    <Label htmlFor="order-notes" className="text-base font-semibold text-foreground flex items-center space-x-2">
                      <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Order Notes (Optional)</span>
                    </Label>
                    <textarea
                      id="order-notes"
                      value={form.watch("notes") || ""}
                      onChange={(e) => form.setValue("notes", e.target.value)}
                      className="w-full mt-3 px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground"
                      rows={4}
                      placeholder="Add any special instructions for this order..."
                      disabled={loading}
                    />
                    <p className="text-sm text-muted-foreground mt-2 flex items-center space-x-1">
                      <span>💡</span>
                      <span>These notes will be visible to staff processing the order</span>
                    </p>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-border flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveTab("services")}
                      className="px-6"
                    >
                      ← Back to Services
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setActiveTab("summary")}
                      className="px-8"
                    >
                      Continue to Summary →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="space-y-6 mt-0">
              <OrderSummarySection
                form={form}
                selectedCustomer={selectedCustomer}
                orderItems={orderItems}
                totals={totals}
                loading={loading}
                onSubmit={form.handleSubmit(onSubmit)}
                onBack={() => setActiveTab("review")}
              />
            </TabsContent>
          </form>
        </Tabs>
        {/* Hidden print container for receipt */}
        {printOrder && (
          <div id="printable-receipt" className="print-area">
            <OrderReceipt order={printOrder as any} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NewOrderPage;