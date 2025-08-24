import React, { useState, useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Search, User, Plus, Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useGetCustomersQuery } from "@/store/api/customerApi";
import type { Customer } from "@/types";

interface CustomerSearchSectionProps {
  form: UseFormReturn<any>;
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer) => void;
  onCustomerCreate: (customerData: {
    cname: string;
    mobile: string;
    add1?: string;
  }) => Promise<Customer>;
  loading: boolean;
}

const CustomerSearchSection: React.FC<CustomerSearchSectionProps> = ({
  form,
  selectedCustomer,
  onCustomerSelect,
  onCustomerCreate,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    cname: "",
    mobile: "",
    add1: "",
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use RTK Query for customer search
  const { 
    data: customers = [], 
    isLoading, 
    isError 
  } = useGetCustomersQuery(
    { search: searchTerm, limit: 10 },
    { skip: searchTerm.length < 2 }
  );

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setSearchTerm(customer.mobile);
    setIsDropdownVisible(false);
    setIsCreating(false);
  };

  const handleNewCustomerClick = () => {
    setNewCustomerData({
      cname: "",
      mobile: searchTerm,
      add1: "",
    });
    setIsCreating(true);
    setIsDropdownVisible(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerData.cname || !newCustomerData.mobile) {
      return;
    }

    try {
      const newCustomer = await onCustomerCreate(newCustomerData);
      setSearchTerm(newCustomer.mobile);
      setIsCreating(false);
      setNewCustomerData({ cname: "", mobile: "", add1: "" });
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewCustomerData({ cname: "", mobile: "", add1: "" });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleChangeCustomer = () => {
    form.setValue("customer_id", 0);
    form.setValue("customer_name", "");
    form.setValue("customer_mobile", "");
    form.setValue("customer_address", "");
    setSearchTerm("");
    setIsCreating(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        scrollAreaRef.current &&
        !scrollAreaRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // If customer is selected, show customer info
  if (selectedCustomer && !isCreating) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">{selectedCustomer.cname}</h3>
              <p className="text-green-700">{selectedCustomer.mobile}</p>
              {selectedCustomer.add1 && (
                <p className="text-sm text-green-600">{selectedCustomer.add1}</p>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleChangeCustomer}
            disabled={loading}
          >
            Change Customer
          </Button>
        </div>
      </div>
    );
  }

  // If creating new customer, show create form
  if (isCreating) {
    return (
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-4">Create New Customer</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-customer-name">Customer Name *</Label>
              <Input
                id="new-customer-name"
                value={newCustomerData.cname}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, cname: e.target.value }))}
                placeholder="Enter customer name"
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="new-customer-mobile">Mobile Number *</Label>
              <Input
                id="new-customer-mobile"
                value={newCustomerData.mobile}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="Enter mobile number"
                disabled={loading}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="new-customer-address">Address (Optional)</Label>
              <Input
                id="new-customer-address"
                value={newCustomerData.add1}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, add1: e.target.value }))}
                placeholder="Enter customer address"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelCreate}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCustomer}
              disabled={loading || !newCustomerData.cname || !newCustomerData.mobile}
            >
              Create Customer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default search interface
  return (
    <div className="space-y-4">
      <div className="relative">
        <Label htmlFor="customer-search">Search Customer</Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            ref={inputRef}
            id="customer-search"
            placeholder="Search by name or mobile number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownVisible(e.target.value.length >= 2);
            }}
            className="pl-10"
            disabled={loading}
          />
        </div>

        {isError && (
          <p className="text-red-500 text-sm mt-1">Error loading customers</p>
        )}

        {/* Search Results Dropdown */}
        <div className="absolute top-full left-0 right-0 z-50 mt-1" ref={scrollAreaRef}>
          {isDropdownVisible && searchTerm.length >= 2 && (
            <div className="bg-white border rounded-md shadow-lg max-h-60 overflow-hidden">
              <ScrollArea className="max-h-60">
                <div className="p-2">
                  {isLoading ? (
                    <div className="text-center py-4 text-gray-500">
                      Loading customers...
                    </div>
                  ) : customers.length > 0 ? (
                    <>
                      {customers.map((customer: Customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                          className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer rounded-md"
                        >
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{customer.cname}</p>
                            <p className="text-sm text-gray-500">{customer.mobile}</p>
                          </div>
                        </div>
                      ))}
                      <Separator className="my-2" />
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No customers found
                    </div>
                  )}
                  
                  {/* Create New Customer Option */}
                  <div
                    onClick={handleNewCustomerClick}
                    className="flex items-center space-x-3 p-3 hover:bg-blue-50 cursor-pointer rounded-md border-t"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">Create New Customer</p>
                      <p className="text-sm text-blue-600">
                        {searchTerm ? `with mobile: ${searchTerm}` : "Add a new customer"}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {searchTerm.length > 0 && searchTerm.length < 2 && (
        <p className="text-gray-500 text-sm">
          Type at least 2 characters to search for customers
        </p>
      )}
    </div>
  );
};

export default CustomerSearchSection;