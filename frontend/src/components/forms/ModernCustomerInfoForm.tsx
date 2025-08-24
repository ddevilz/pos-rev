import React, { useState, useEffect, useRef } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
import { useGetCustomersQuery } from "@/store/api/customerApi";
import type { Customer } from "@/types";

interface ModernCustomerInfoFormProps {
  form: UseFormReturn<any>;
  loading: boolean;
}

const ModernCustomerInfoForm: React.FC<ModernCustomerInfoFormProps> = ({
  form,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const scrollAreaRef = useRef(null);

  // Use RTK Query for customer search
  const { 
    data: customers = [], 
    isLoading, 
    isError 
  } = useGetCustomersQuery(
    { search: searchTerm, limit: 10 },
    { skip: searchTerm.length < 2 } // Only search when we have at least 2 characters
  );

  const handleCustomerSelect = (customer: Customer) => {
    form.setValue("customer_id", customer.id);
    form.setValue("mobile", customer.mobile);
    form.setValue("cname", customer.cname);
    form.setValue("add1", customer.add1 || "");
    setSearchTerm(customer.mobile);
    setIsDropdownVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        scrollAreaRef.current &&
        !(scrollAreaRef.current as any).contains(event.target)
      ) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [scrollAreaRef]);

  return (
    <>
      <div className="flex gap-1 relative">
        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={loading}
                  placeholder="9876541230"
                  type="text"
                  required
                  autoComplete="off"
                  onChange={(e) => {
                    field.onChange(e);
                    setSearchTerm(e.target.value);
                    setIsDropdownVisible(e.target.value.length >= 2);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {isError && <p className="text-red-500 text-sm">Error loading customers</p>}
        
        <div className="absolute top-[5rem] z-50" ref={scrollAreaRef}>
          {isDropdownVisible && customers && customers.length > 0 && (
            <ScrollArea className="h-72 w-42 bg-black text-white rounded-md border shadow-lg">
              <div className="p-4">
                {isLoading ? (
                  <div className="text-center py-2">Loading...</div>
                ) : (
                  customers.map((customer: Customer) => (
                    <React.Fragment key={customer.id}>
                      <div
                        onClick={() => handleCustomerSelect(customer)}
                        className="cursor-pointer hover:bg-gray-800 p-2 rounded"
                      >
                        {customer.cname} - {customer.mobile}
                      </div>
                      <Separator className="my-2" />
                    </React.Fragment>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
        
        <FormField
          control={form.control}
          name="cname"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={loading}
                  placeholder="Name"
                  type="text"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="add1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled={loading}
                placeholder="Address"
                type="text"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default ModernCustomerInfoForm;