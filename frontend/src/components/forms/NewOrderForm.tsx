import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

import FormHOC from "./form-hoc";
import ModernCustomerInfoForm from "./ModernCustomerInfoForm";
import ModernServicesSelection from "./ModernServicesSelection";
import ModernTotalInvoice from "./ModernTotalInvoice";
import { Button } from "@/components/ui/button";
import { FormError } from "../form-error";
import { FormSuccess } from "../form-success";
import { useCreateOrderMutation } from "@/store/api/orderApi";
import { useCreateCustomerMutation } from "@/store/api/customerApi";

// Service item schema for the form
const serviceItemSchema = z.object({
  service_id: z.number().min(1, "Service is required"),
  iname: z.string().min(1, "Service name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0.01, "Rate must be greater than 0"),
  notes: z.string().optional(),
});

// Main order form schema
const orderFormSchema = z.object({
  // Customer info
  customer_id: z.number().min(0, "Customer ID"),
  mobile: z.string().min(10, "Mobile number is required"),
  cname: z.string().min(1, "Customer name is required"),
  add1: z.string().optional(),
  
  // Order details
  due_date: z.string().min(1, "Due date is required"),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  notes: z.string().optional(),
  
  // Financial details
  discount_percentage: z.number().min(0).max(100).default(0),
  tax_percentage: z.number().min(0).max(100).default(0),
  advance_paid: z.number().min(0).default(0),
  
  // Services
  items: z.array(serviceItemSchema).min(1, "At least one service is required"),
});

type OrderFormData = z.infer<typeof orderFormSchema>;
type ServiceItem = z.infer<typeof serviceItemSchema>;

const NewOrderForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [addedServices, setAddedServices] = useState<ServiceItem[]>([]);

  const [createOrder] = useCreateOrderMutation();
  const [createCustomer] = useCreateCustomerMutation();
  const { selectedRate } = useSelector((state: RootState) => state.rate);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customer_id: 0,
      mobile: "",
      cname: "",
      add1: "",
      due_date: "",
      priority: "normal",
      notes: "",
      discount_percentage: 0,
      tax_percentage: 0,
      advance_paid: 0,
      items: [],
    },
  });

  const onSubmit = async (data: OrderFormData) => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      if (!data.mobile || !data.cname) {
        toast.warning("Mobile number and customer name are required.");
        return;
      }
      if (!data.due_date) {
        toast.warning("Due date is required.");
        return;
      }
      if (addedServices.length === 0) {
        toast.warning("Please add at least one service.");
        return;
      }

      let customerId = data.customer_id;

      // If no customer is selected (customer_id is 0), create a new customer
      if (customerId === 0) {
        try {
          const customerData = {
            cname: data.cname,
            mobile: data.mobile,
            add1: data.add1 || undefined,
            rtype: 'regular' as const,
          };
          
          const newCustomer = await createCustomer(customerData).unwrap();
          customerId = newCustomer.id;
          
          toast.success("New customer created successfully!");
        } catch (customerErr: any) {
          console.error("Customer creation error:", customerErr);
          const customerErrorMessage = customerErr?.data?.error?.message || "Failed to create customer.";
          setError(customerErrorMessage);
          toast.error(customerErrorMessage);
          return;
        }
      }

      // Prepare order data in the format expected by the API
      const orderData = {
        customer_id: customerId,
        due_date: data.due_date,
        priority: data.priority,
        discount_percentage: data.discount_percentage,
        tax_percentage: data.tax_percentage,
        advance_paid: data.advance_paid,
        notes: data.notes || undefined,
        items: addedServices.map(service => ({
          service_id: service.service_id,
          quantity: service.quantity,
          rate: service.rate,
          notes: service.notes || undefined,
        })),
      };

      console.log("Creating order with data:", orderData);
      await createOrder(orderData).unwrap();
      
      toast.success("Order created successfully!");
      setSuccess("Order created successfully!");
      
      // Reset form
      form.reset();
      setAddedServices([]);
      
    } catch (err: any) {
      console.error("Order creation error:", err);
      const errorMessage = err?.data?.error?.message || "There was an error creating the order.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = (service: ServiceItem) => {
    setAddedServices(prev => [...prev, service]);
    // Update form items array
    const currentItems = form.getValues("items");
    form.setValue("items", [...currentItems, service]);
  };

  const handleRemoveService = (index: number) => {
    setAddedServices(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    
    // Update form items array
    const currentItems = form.getValues("items");
    const updatedItems = [...currentItems];
    updatedItems.splice(index, 1);
    form.setValue("items", updatedItems);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-4">
      {/* Customer Info Form - Spans across all columns */}
      <div className="col-span-1 lg:col-span-4">
        <FormHOC title="Customer Info" form={form}>
          {(formLoading) => (
            <ModernCustomerInfoForm form={form} loading={formLoading || loading} />
          )}
        </FormHOC>
      </div>

      {/* Services Selection */}
      <div className="col-span-1 lg:col-span-2">
        <FormHOC title="Services Selection" form={form}>
          {(formLoading) => (
            <ModernServicesSelection
              form={form}
              loading={formLoading || loading}
              onAddService={handleAddService}
              selectedRate={selectedRate}
            />
          )}
        </FormHOC>
      </div>

      {/* Total Invoice */}
      <div className="col-span-1 lg:col-span-2">
        <FormHOC title="Total Invoice" form={form}>
          {(formLoading) => (
            <ModernTotalInvoice
              form={form}
              loading={formLoading || loading}
              addedServices={addedServices}
              removeServices={handleRemoveService}
            />
          )}
        </FormHOC>

        <FormError message={error} />
        <FormSuccess message={success} />

        {/* Submit Button */}
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
          className="w-full mt-4"
        >
          {loading ? "Creating Order..." : "Create Order"}
        </Button>
      </div>
    </div>
  );
};

export default NewOrderForm;