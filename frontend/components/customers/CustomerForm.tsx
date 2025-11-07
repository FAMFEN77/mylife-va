 "use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";

export const customerSchema = z.object({
  companyName: z.string().max(200).optional().or(z.literal("")),
  firstName: z.string().min(1, "Voornaam is verplicht").max(100),
  lastName: z.string().min(1, "Achternaam is verplicht").max(100),
  email: z.string().email("Ongeldig e-mailadres").max(255),
  phone: z.string().max(50).optional().or(z.literal("")),
  street: z.string().optional().or(z.literal("")),
  houseNumber: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  kvkNumber: z.string().optional().or(z.literal("")),
  vatNumber: z.string().optional().or(z.literal("")),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: CustomerFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

export function CustomerForm({
  defaultValues,
  submitLabel = "Opslaan",
  isSubmitting = false,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      companyName: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      country: "",
      kvkNumber: "",
      vatNumber: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        companyName: defaultValues.companyName ?? "",
        firstName: defaultValues.firstName ?? "",
        lastName: defaultValues.lastName ?? "",
        email: defaultValues.email ?? "",
        phone: defaultValues.phone ?? "",
        street: defaultValues.street ?? "",
        houseNumber: defaultValues.houseNumber ?? "",
        postalCode: defaultValues.postalCode ?? "",
        city: defaultValues.city ?? "",
        country: defaultValues.country ?? "",
        kvkNumber: defaultValues.kvkNumber ?? "",
        vatNumber: defaultValues.vatNumber ?? "",
      });
    }
  }, [defaultValues, reset]);

  const submit = (values: CustomerFormValues) => {
    const sanitized = Object.fromEntries(
      Object.entries(values).map(([key, value]) => {
        if (typeof value === "string") {
          const trimmed = value.trim();
          return [key, trimmed.length ? trimmed : undefined];
        }
        return [key, value];
      }),
    ) as CustomerFormValues;
    return Promise.resolve(onSubmit(sanitized));
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Bedrijf</label>
          <input className="mt-1 w-full rounded border p-2" type="text" {...register("companyName")} />
          {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">E-mail</label>
          <input className="mt-1 w-full rounded border p-2" type="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Voornaam</label>
          <input className="mt-1 w-full rounded border p-2" type="text" {...register("firstName")} />
          {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Achternaam</label>
          <input className="mt-1 w-full rounded border p-2" type="text" {...register("lastName")} />
          {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Telefoon</label>
          <input className="mt-1 w-full rounded border p-2" type="text" {...register("phone")} />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">KvK-nummer</label>
          <input className="mt-1 w-full rounded border p-2" type="text" {...register("kvkNumber")} />
          {errors.kvkNumber && <p className="mt-1 text-xs text-red-600">{errors.kvkNumber.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Btw-nummer</label>
          <input className="mt-1 w-full rounded border p-2" type="text" {...register("vatNumber")} />
          {errors.vatNumber && <p className="mt-1 text-xs text-red-600">{errors.vatNumber.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Straat</label>
          <input className="mt-1 w-full rounded border p-2" type="text" {...register("street")} />
          {errors.street && <p className="mt-1 text-xs text-red-600">{errors.street.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Huisnummer</label>
          <input className="mt-1 w-full rounded border p-2" type="text" {...register("houseNumber")} />
          {errors.houseNumber && <p className="mt-1 text-xs text-red-600">{errors.houseNumber.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Postcode</label>
          <input className="mt-1 w-full rounded border p-2" type="text" {...register("postalCode")} />
          {errors.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Plaats</label>
          <input className="mt-1 w-full rounded border p-2" type="text" {...register("city")} />
          {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Land</label>
          <input className="mt-1 w-full rounded border p-2" type="text" {...register("country")} />
          {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting || (!isDirty && !defaultValues)}>
          {isSubmitting ? "Bezig..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuleren
          </Button>
        )}
      </div>
    </form>
  );
}

