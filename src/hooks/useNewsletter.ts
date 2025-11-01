import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useNewsletter = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const subscribe = async (
    email: string,
    source = "footer",
    preferences = {},
  ) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "newsletter-subscription",
        {
          body: {
            email: email.toLowerCase().trim(),
            source,
            preferences,
          },
        },
      );

      if (error) throw error;

      toast({
        title: "Subscription Confirmed!",
        description: "Please check your email to confirm your subscription.",
      });

      return { success: true, data };
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);

      let errorMessage = "Failed to subscribe. Please try again.";
      if (error.message?.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message?.includes("Already subscribed")) {
        errorMessage = "You are already subscribed to our newsletter.";
      }

      toast({
        title: "Subscription Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async (token: string) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "newsletter-subscription",
        {
          body: { token },
          method: "POST",
        },
      );

      if (error) throw error;

      toast({
        title: "Unsubscribed Successfully",
        description: "You have been unsubscribed from our newsletter.",
      });

      return { success: true, data };
    } catch (error: any) {
      console.error("Newsletter unsubscribe error:", error);

      toast({
        title: "Unsubscribe Failed",
        description:
          "Failed to unsubscribe. Please try again or contact support.",
        variant: "destructive",
      });

      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    subscribe,
    unsubscribe,
    loading,
  };
};
