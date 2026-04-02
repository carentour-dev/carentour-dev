"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import { BlogPostEditor } from "@/components/cms/BlogPostEditor";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateReadingTime } from "@/lib/blog/reading-time";
import { CmsLocaleSwitcher } from "@/components/cms/CmsLocaleSwitcher";
import {
  buildAdminLocaleHref,
  resolveAdminLocale,
} from "@/lib/public/adminLocale";

export default function NewBlogPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const locale = resolveAdminLocale(
    new URLSearchParams(searchParams.toString()),
  );
  const isArabicLocale = locale === "ar";
  const postsHref = buildAdminLocaleHref("/cms/blog/posts", locale);

  const handleSave = async (postData: any, status: "draft" | "published") => {
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Calculate reading time
      let contentText = "";
      if (postData.content.type === "html") {
        contentText = postData.content.data.replace(/<[^>]*>/g, "");
      } else if (postData.content.type === "markdown") {
        contentText = postData.content.data;
      } else if (postData.content.type === "richtext") {
        contentText = postData.content.data.replace(/<[^>]*>/g, "");
      }
      const readingTime = calculateReadingTime(contentText);

      const payload = {
        ...postData,
        status,
        reading_time: readingTime,
        publish_date: status === "published" ? new Date().toISOString() : null,
      };

      const res = await fetch(`/api/cms/blog/posts?locale=${locale}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save post");
      }

      const data = await res.json();

      toast({
        title: status === "published" ? "Post published!" : "Draft saved!",
        description: `Your blog post has been ${status === "published" ? "published" : "saved as a draft"}.`,
      });

      // Redirect to posts list or edit page
      router.push(
        buildAdminLocaleHref(`/cms/blog/posts/${data.post.id}/edit`, locale),
      );
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <CmsLocaleSwitcher
        locale={locale}
        description={
          isArabicLocale
            ? "Arabic blog posts are created from existing English posts. Open an English post, switch to Arabic, then add the translation."
            : "English owns base posts, taxonomy assignments, and publishing defaults."
        }
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={postsHref}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isArabicLocale ? "Arabic Post Translation" : "Create New Post"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isArabicLocale
                ? "New Arabic posts start from an existing English base post."
                : "Write and publish a new blog post"}
            </p>
          </div>
        </div>
      </div>

      {/* Editor */}
      {isArabicLocale ? (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
          Create the English post first, then use the locale switcher on its
          edit screen to add Arabic content.
        </div>
      ) : (
        <BlogPostEditor onSave={handleSave} saving={saving} locale={locale} />
      )}
    </div>
  );
}
