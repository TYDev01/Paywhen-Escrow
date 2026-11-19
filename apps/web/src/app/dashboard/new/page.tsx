"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authedFetch, getAccessToken } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Container } from "@/components/ui/container";

const schema = z.object({
  title: z.string().min(3, "Give the transaction a title"),
  description: z.string().min(10, "Describe the product or service"),
  category: z.string().min(2, "Enter a category"),
  counterpartyEmail: z.string().email("Enter the other party’s email"),
  creatorRole: z.enum(["BUYER", "SELLER"]),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter an amount like 150.00"),
  currency: z.enum(["USD", "EUR", "GBP", "NGN", "JPY"]),
  feePayer: z.enum(["BUYER", "SELLER", "SPLIT"]),
  inspectionPeriodHours: z.coerce.number().int().min(1, "At least 1 hour"),
  releaseConditions: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function NewEscrowPage() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      creatorRole: "BUYER",
      currency: "USD",
      feePayer: "BUYER",
      inspectionPeriodHours: 72,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const res = await authedFetch<{ transaction: { id: string } }>("/agreements", {
        method: "POST",
        body: JSON.stringify(values),
      });
      router.push(`/dashboard/transactions/${res.transaction.id}`);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Could not create the agreement.");
    }
  };

  return (
    <Container className="max-w-2xl py-10">
      <Link href="/dashboard" className="text-sm text-fg-muted hover:text-fg">
        ← Back to dashboard
      </Link>
      <h1 className="editorial-title mt-5 !text-[clamp(2.25rem,5vw,4.5rem)]">Create an escrow agreement</h1>
      <p className="mt-4 text-base leading-relaxed text-fg-muted">
        Both you and the counterparty must accept the terms before anything progresses to
        funding. The exact fee is calculated and recorded on the agreement.
      </p>

      {serverError && (
        <div role="alert" className="mt-6 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5 border-t border-border pt-6" noValidate>
        <Field label="Title" htmlFor="title" error={errors.title?.message}>
          <Input id="title" {...register("title")} />
        </Field>
        <Field label="Description" htmlFor="description" error={errors.description?.message}>
          <textarea
            id="description"
            rows={4}
            className="w-full rounded-md border border-border bg-surface p-3.5 text-sm focus-visible:border-primary focus-visible:outline-none"
            {...register("description")}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="category" error={errors.category?.message}>
            <Input id="category" placeholder="e.g. Electronics, Design" {...register("category")} />
          </Field>
          <Field label="Counterparty email" htmlFor="counterpartyEmail" error={errors.counterpartyEmail?.message}>
            <Input id="counterpartyEmail" type="email" {...register("counterpartyEmail")} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="I am the" htmlFor="creatorRole" error={errors.creatorRole?.message}>
            <Select id="creatorRole" {...register("creatorRole")}>
              <option value="BUYER">Buyer</option>
              <option value="SELLER">Seller</option>
            </Select>
          </Field>
          <Field label="Amount" htmlFor="amount" error={errors.amount?.message}>
            <Input id="amount" inputMode="decimal" placeholder="150.00" {...register("amount")} />
          </Field>
          <Field label="Currency" htmlFor="currency" error={errors.currency?.message}>
            <Select id="currency" {...register("currency")}>
              {["USD", "EUR", "GBP", "NGN", "JPY"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Who pays the fee" htmlFor="feePayer" error={errors.feePayer?.message}>
            <Select id="feePayer" {...register("feePayer")}>
              <option value="BUYER">Buyer</option>
              <option value="SELLER">Seller</option>
              <option value="SPLIT">Split 50/50</option>
            </Select>
          </Field>
          <Field label="Inspection period (hours)" htmlFor="inspectionPeriodHours" error={errors.inspectionPeriodHours?.message}>
            <Input id="inspectionPeriodHours" type="number" min={1} {...register("inspectionPeriodHours")} />
          </Field>
        </div>
        <Field label="Release conditions (optional)" htmlFor="releaseConditions" error={errors.releaseConditions?.message}>
          <textarea
            id="releaseConditions"
            rows={3}
            className="w-full rounded-md border border-border bg-surface p-3.5 text-sm focus-visible:border-primary focus-visible:outline-none"
            {...register("releaseConditions")}
          />
        </Field>

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create agreement"}
        </Button>
      </form>
    </Container>
  );
}

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:border-primary focus-visible:outline-none"
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
