import React, { useState } from "react";
import { ArrowLeft, Plus, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetCategoriesQuery } from "@/store/api/categoryApi";
import { useGetServicesQuery } from "@/store/api/serviceApi";
import type { Category, Service } from "@/types";
import type { RateType } from "@/store/slices/rateSlice";

interface ServiceSelectionSectionProps {
  onServiceAdd: (service: Service, quantity?: number, notes?: string) => void;
  selectedRate: RateType;
  loading: boolean;
}

const ServiceSelectionSection: React.FC<ServiceSelectionSectionProps> = ({
  onServiceAdd,
  selectedRate,
  loading,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceDetails, setServiceDetails] = useState({
    quantity: 1,
    notes: "",
  });

  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useGetCategoriesQuery({ is_active: true });

  const {
    data: services = [],
    isLoading: isServicesLoading,
    isError: isServicesError,
  } = useGetServicesQuery(
    { category_id: selectedCategory?.id, is_active: true },
    { skip: !selectedCategory }
  );

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setSelectedService(null);
    setServiceDetails({ quantity: 1, notes: "" });
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedService(null);
    setServiceDetails({ quantity: 1, notes: "" });
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setServiceDetails({ quantity: 1, notes: "" });
  };

  const handleAddService = () => {
    if (selectedService) {
      onServiceAdd(selectedService, serviceDetails.quantity, serviceDetails.notes);
      setSelectedService(null);
      setServiceDetails({ quantity: 1, notes: "" });
      // Stay in services list for easy addition of more services
    }
  };

  const handleCancelService = () => {
    setSelectedService(null);
    setServiceDetails({ quantity: 1, notes: "" });
  };

  const getCurrentRate = (service: Service): number => {
    return service[selectedRate] || service.rate1 || 0;
  };

  const calculateAmount = (): number => {
    if (!selectedService) return 0;
    return getCurrentRate(selectedService) * serviceDetails.quantity;
  };

  // Category Selection View
  if (!selectedCategory) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Select a Service Category</h3>
          <p className="text-muted-foreground">Choose a category to view available services</p>
        </div>

        {isCategoriesError && (
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-medium">Error loading categories</p>
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">Please try again.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isCategoriesLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-28 bg-muted rounded-xl animate-pulse"
              />
            ))
          ) : (
            categories.map((category: Category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="group h-28 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center p-6 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-400"
              >
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-sm leading-tight">
                    {category.category}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Service Selection View
  if (selectedCategory && !selectedService) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBackToCategories}
            className="flex items-center space-x-2 px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Categories</span>
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {selectedCategory.category}
              </h3>
              <p className="text-sm text-muted-foreground">
                Select a service to configure and add
              </p>
            </div>
          </div>
        </div>

        {isServicesError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-medium">Error loading services</p>
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">Please try again.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isServicesLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-36 bg-muted rounded-xl animate-pulse"
              />
            ))
          ) : services.length > 0 ? (
            services.map((service: Service) => (
              <div
                key={service.id}
                onClick={() => handleServiceClick(service)}
                className="group h-36 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex flex-col justify-between p-5 border-2 border-transparent hover:border-primary/50"
              >
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-sm leading-tight">
                      {service.iname}
                    </span>
                  </div>
                </div>
                <div className="text-center bg-white/20 rounded-lg py-2 px-3 group-hover:bg-white/30 transition-colors">
                  <div className="text-xs font-medium opacity-90">Starting at</div>
                  <div className="text-sm font-bold">₹{getCurrentRate(service)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium">No services available</p>
                <p className="text-sm">This category doesn't have any services yet</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Service Details Form
  if (selectedService) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancelService}
            className="flex items-center space-x-2 px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Services</span>
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Configure Service
              </h3>
              <p className="text-sm text-muted-foreground">
                Set quantity and add to order
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-card to-muted/30 rounded-xl p-8 border-2 border-border shadow-sm space-y-6">
          {/* Service Header */}
          <div className="text-center pb-6 border-b border-border">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-2xl font-bold text-foreground mb-2">
              {selectedService.iname}
            </h4>
            <p className="text-muted-foreground text-sm">
              Category: {selectedCategory?.category}
            </p>
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium text-primary mr-2">Rate:</span>
              <span className="text-lg font-bold text-primary">₹{getCurrentRate(selectedService)}</span>
              <span className="text-sm text-primary ml-1">per item</span>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="service-quantity" className="text-base font-semibold text-foreground">
                Quantity
              </Label>
              <Input
                id="service-quantity"
                type="number"
                min="1"
                step="1"
                value={serviceDetails.quantity}
                onChange={(e) => setServiceDetails(prev => ({
                  ...prev,
                  quantity: parseInt(e.target.value) || 1
                }))}
                className="mt-2 h-12 text-lg"
              />
            </div>

            <div>
              <Label className="text-base font-semibold text-foreground">Total Amount</Label>
              <div className="mt-2 h-12 p-4 bg-primary/10 border-2 border-primary/20 rounded-lg flex items-center">
                <span className="text-2xl font-bold text-primary">
                  ₹{calculateAmount().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="service-notes" className="text-base font-semibold text-foreground">
                Special Instructions (Optional)
              </Label>
              <Input
                id="service-notes"
                value={serviceDetails.notes}
                onChange={(e) => setServiceDetails(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                placeholder="Any special instructions for this service..."
                className="mt-2 h-12"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelService}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Services</span>
            </Button>
            <Button
              type="button"
              onClick={handleAddService}
              disabled={loading}
              className="flex items-center space-x-2 px-8 py-3 text-lg bg-primary hover:bg-primary/90"
            >
              <Plus className="w-5 h-5" />
              <span>Add to Order</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ServiceSelectionSection;