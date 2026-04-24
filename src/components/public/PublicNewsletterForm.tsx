"use client";

import { useState, type FormEvent } from "react";

type PublicNewsletterFormProps = {
  placeholder: string;
  submittingLabel: string;
  submitLabel: string;
};

export default function PublicNewsletterForm({
  placeholder,
  submittingLabel,
  submitLabel,
}: PublicNewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }

    setLoading(true);

    try {
      const [{ supabase }, { toast }] = await Promise.all([
        import("@/integrations/supabase/client"),
        import("@/hooks/use-toast"),
      ]);
      const { error } = await supabase.functions.invoke(
        "newsletter-subscription",
        {
          body: {
            email: email.toLowerCase().trim(),
            source: "footer",
            preferences: {},
          },
        },
      );

      if (error) {
        throw error;
      }

      toast({
        title: "Subscription Confirmed!",
        description: "Please check your email to confirm your subscription.",
      });
      setEmail("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      let errorMessage = "Failed to subscribe. Please try again.";
      if (message.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (message.includes("Already subscribed")) {
        errorMessage = "You are already subscribed to our newsletter.";
      }

      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Subscription Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        placeholder={placeholder}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        required
      />
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-premium px-4 text-sm font-semibold tracking-tight text-premium-foreground ring-offset-background transition-all duration-200 ease-smooth hover:bg-premium/90 hover:shadow-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
        disabled={loading}
      >
        {loading ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
