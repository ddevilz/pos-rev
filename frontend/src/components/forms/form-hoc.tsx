import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Form } from "@/components/ui/form";

interface FormHOCProps {
  title: string;
  form: UseFormReturn<any>;
  children: (loading: boolean) => React.ReactNode;
}

const FormHOC: React.FC<FormHOCProps> = ({ title, form, children }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
        {title}
      </h2>
      <Form {...form}>
        {children(false)}
      </Form>
    </div>
  );
};

export default FormHOC;