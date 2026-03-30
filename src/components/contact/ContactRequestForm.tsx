"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { BlockValue } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  country: z.string().optional(),
  treatment: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

type ContactRequestFormValues = z.infer<typeof formSchema>;

type ContactRequestFormBlock = BlockValue<"contactFormEmbed">;

const requiredFieldNames = new Set<keyof ContactRequestFormValues>([
  "firstName",
  "lastName",
  "email",
  "message",
]);

function renderLabel(
  label: string,
  fieldName: keyof ContactRequestFormValues,
): string {
  return requiredFieldNames.has(fieldName) ? `${label} *` : label;
}

export function ContactRequestForm({
  block,
  className,
}: {
  block: ContactRequestFormBlock;
  className?: string;
}) {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactRequestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "",
      treatment: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactRequestFormValues) => {
    setIsSubmitting(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        headers,
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to submit contact request");
      }

      toast({
        title: block.successTitle ?? "Message Sent",
        description:
          block.successDescription ??
          "We have received your enquiry and our team will contact you shortly.",
      });

      form.reset();
    } catch (error) {
      console.error("Error sending contact form:", error);
      toast({
        title: block.errorTitle ?? "Unable To Send Message",
        description:
          block.errorDescription ??
          "Please try again or use one of the listed contact channels.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground md:text-3xl">
          {block.formTitle}
        </h2>
        {block.formDescription ? (
          <p className="text-sm leading-7 text-muted-foreground md:text-base">
            {block.formDescription}
          </p>
        ) : null}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 flex flex-1 flex-col gap-5"
          noValidate
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {renderLabel(block.labels.firstName, "firstName")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="given-name"
                      placeholder={block.placeholders.firstName}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {renderLabel(block.labels.lastName, "lastName")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="family-name"
                      placeholder={block.placeholders.lastName}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {renderLabel(block.labels.email, "email")}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder={block.placeholders.email}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {renderLabel(block.labels.phone, "phone")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder={block.placeholders.phone}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {renderLabel(block.labels.country, "country")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="country-name"
                      placeholder={block.placeholders.country}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="treatment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {renderLabel(block.labels.treatment, "treatment")}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="off"
                    placeholder={block.placeholders.treatment}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex min-h-[12rem] flex-1 flex-col">
                <FormLabel>
                  {renderLabel(block.labels.message, "message")}
                </FormLabel>
                <FormControl className="flex-1">
                  <Textarea
                    {...field}
                    autoComplete="off"
                    className="h-full min-h-[160px] resize-none lg:min-h-[240px]"
                    placeholder={block.placeholders.message}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? block.submittingLabel : block.submitLabel}
          </Button>
        </form>
      </Form>

      {block.privacyNote ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {block.privacyNote}
        </p>
      ) : null}
    </div>
  );
}
