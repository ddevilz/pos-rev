import React, { useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { useGetCategoriesQuery } from "@/store/api/categoryApi";
import { useGetServicesQuery } from "@/store/api/serviceApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Category, Service } from "@/types";
import type { RateType } from "@/store/slices/rateSlice";

interface ModernServicesSelectionProps {
  form: UseFormReturn<any>;
  loading: boolean;
  onAddService: (service: SelectedService) => void;
  selectedRate: RateType;
}

interface SelectedService {
  service_id: number;
  iname: string;
  rate: number;
  quantity: number;
  notes?: string;
}

const ModernServicesSelection: React.FC<ModernServicesSelectionProps> = ({
  form,
  loading,
  onAddService,
  selectedRate,
}) => {
  // Mark as used; future enhancements may use form context here
  void form;
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useGetCategoriesQuery({ is_active: true });

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedService, setSelectedService] = useState<SelectedService | null>(null);

  const {
    data: servicesData,
    isLoading: isServicesLoading,
    isError: isServicesError,
  } = useGetServicesQuery(
    { category_id: selectedCategory?.id, is_active: true },
    { skip: !selectedCategory }
  );

  const serviceForm = useForm({
    defaultValues: {
      iname: "",
      rate: 0,
      quantity: 1,
      notes: "",
    },
  });

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setSelectedService(null);
  };

  const handleBackClick = () => {
    setSelectedCategory(null);
  };

  const handleServiceClick = (service: Service) => {
    const rate = (service as any)[selectedRate] || service.rate1 || 0;
    const selectedServiceWithDefaults: SelectedService = {
      service_id: service.id,
      iname: service.iname,
      rate,
      quantity: 1,
      notes: "",
    };
    setSelectedService(selectedServiceWithDefaults);
    serviceForm.setValue("iname", service.iname);
    serviceForm.setValue("rate", rate);
    serviceForm.setValue("quantity", 1);
    serviceForm.setValue("notes", "");
  };

  const handleAddService = (data: any) => {
    if (selectedService) {
      const newService: SelectedService = {
        service_id: selectedService.service_id,
        iname: data.iname,
        rate: data.rate,
        quantity: data.quantity,
        notes: data.notes || "",
      };
      onAddService(newService);
      setSelectedService(null);
      serviceForm.reset();
    }
  };

  return (
    <div className="p-4">
      {selectedCategory === null ? (
        <>
          <h1 className="text-2xl font-bold mb-4 text-center">
            Select a Category
          </h1>
          {isCategoriesError && (
            <p className="text-red-500">Error loading categories</p>
          )}
          <div className="flex flex-wrap gap-4">
            {isCategoriesLoading ? (
              <p>Loading categories...</p>
            ) : (
              categoriesData &&
              categoriesData.map((category: Category) => (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="w-32 h-32 bg-blue-500 text-white flex items-center justify-center cursor-pointer rounded-md hover:bg-blue-600 transition-colors"
                >
                  <span className="text-center text-sm font-medium px-2">
                    {category.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div>
            <button
              onClick={handleBackClick}
              className="mb-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h2 className="text-xl font-semibold mb-4 text-center">
              Services in {selectedCategory.category}
            </h2>
          </div>
          {isServicesError && (
            <p className="text-red-500">Error loading services</p>
          )}
          {isServicesLoading ? (
            <p>Loading services...</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {servicesData &&
                servicesData.map((service: Service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    className="w-32 h-32 bg-blue-500 text-white flex items-center justify-center cursor-pointer rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <span className="text-center text-sm font-medium px-2">
                      {service.iname}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {selectedService && (
        <div className="mt-4">
          <h3 className="text-lg font-bold mb-4">Add Service</h3>
          <form
            onSubmit={serviceForm.handleSubmit(handleAddService)}
            className="space-y-4"
          >
            <div className="flex space-x-4">
              <Input
                {...serviceForm.register("iname")}
                placeholder="Service Name"
                readOnly
              />
              <Input
                {...serviceForm.register("rate", { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                placeholder="Rate"
              />
              <Input
                {...serviceForm.register("quantity", { valueAsNumber: true })}
                type="number"
                min="1"
                step="1"
                placeholder="Quantity"
              />
              <Input 
                {...serviceForm.register("notes")} 
                placeholder="Notes" 
              />
            </div>
            <Button type="submit" disabled={loading}>
              Add Service
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ModernServicesSelection;