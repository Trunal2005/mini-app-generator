"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateZodSchema } from "@/lib/runtime-engine";
import { FieldConfig } from "@/types/config.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

interface DynamicFormProps {
  fields: FieldConfig[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  defaultValues?: Record<string, unknown>;
  submitLabel?: string;
}

export default function DynamicForm({
  fields,
  onSubmit,
  defaultValues = {},
  submitLabel = "Submit",
}: DynamicFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const schema = generateZodSchema(fields);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    setServerError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const renderField = (field: FieldConfig) => {
    const error = errors[field.name];
    const errorMessage = typeof error?.message === "string" ? error.message : undefined;

    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name} className="text-sm font-medium text-gray-200">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </Label>

        {field.type === "textarea" && (
          <Textarea
            id={field.name}
            {...register(field.name)}
            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500"
            rows={4}
          />
        )}

        {field.type === "select" && (
          <Select
            onValueChange={(val) => setValue(field.name, val)}
            defaultValue={defaultValues[field.name] as string | undefined}
          >
            <SelectTrigger
              id={field.name}
              className="bg-gray-800/50 border-gray-700 text-white focus:border-indigo-500"
            >
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt} className="text-gray-200 focus:bg-gray-700">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === "boolean" && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              defaultChecked={!!defaultValues[field.name]}
              onCheckedChange={(checked) => setValue(field.name, !!checked)}
              className="border-gray-600 data-[state=checked]:bg-indigo-500"
            />
            <label htmlFor={field.name} className="text-sm text-gray-300 cursor-pointer">
              {field.label}
            </label>
          </div>
        )}

        {!["textarea", "select", "boolean"].includes(field.type) && (
          <Input
            id={field.name}
            type={
              field.type === "email"
                ? "email"
                : field.type === "number"
                ? "number"
                : field.type === "date"
                ? "date"
                : "text"
            }
            {...register(field.name)}
            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500"
          />
        )}

        {errorMessage && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errorMessage}
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {serverError && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(renderField)}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 transition-colors"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
