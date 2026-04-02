"use client";

import { useEffect, useState } from "react";
import type { PublicLocale } from "@/i18n/routing";
import { resolveBlogUiText } from "@/lib/blog/localization";
import { Button } from "@/components/ui/button";
import {
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  label?: string;
  locale?: PublicLocale;
}

export function SocialShare({
  url,
  title,
  description,
  label,
  locale = "en",
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState(url);
  const { toast } = useToast();
  const shareLabel = resolveBlogUiText("shareLabel", locale, label);
  const twitterLabel = resolveBlogUiText("shareOnTwitter", locale);
  const facebookLabel = resolveBlogUiText("shareOnFacebook", locale);
  const linkedinLabel = resolveBlogUiText("shareOnLinkedIn", locale);
  const copyLinkLabel = resolveBlogUiText("copyLink", locale);

  useEffect(() => {
    if (url.startsWith("http")) {
      setFullUrl(url);
      return;
    }

    setFullUrl(`${window.location.origin}${url}`);
  }, [url]);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      fullUrl,
    )}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      fullUrl,
    )}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      fullUrl,
    )}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({
        title: resolveBlogUiText("copySuccessTitle", locale),
        description: resolveBlogUiText("copySuccessDescription", locale),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: resolveBlogUiText("copyErrorTitle", locale),
        description: resolveBlogUiText("copyErrorDescription", locale),
        variant: "destructive",
      });
    }
  };

  const openShareWindow = (url: string) => {
    window.open(
      url,
      "share-dialog",
      "width=600,height=450,location=0,menubar=0,toolbar=0,status=0,scrollbars=1,resizable=1",
    );
  };

  return (
    <div className="flex items-center gap-2">
      <span className="mr-2 text-sm text-muted-foreground">{shareLabel}:</span>

      <Button
        variant="outline"
        size="icon"
        onClick={() => openShareWindow(shareLinks.twitter)}
        aria-label={twitterLabel}
      >
        <Twitter className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => openShareWindow(shareLinks.facebook)}
        aria-label={facebookLabel}
      >
        <Facebook className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => openShareWindow(shareLinks.linkedin)}
        aria-label={linkedinLabel}
      >
        <Linkedin className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={copyToClipboard}
        aria-label={copyLinkLabel}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <LinkIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
