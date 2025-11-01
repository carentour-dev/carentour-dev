"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSubmitComment } from "@/hooks/useBlogComments";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CommentForm({
  postId,
  parentId,
  onSuccess,
  onCancel,
}: CommentFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const submitComment = useSubmitComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !content.trim()) {
      toast({
        title: "Validation error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitComment.mutateAsync({
        post_id: postId,
        parent_id: parentId,
        author_name: name.trim(),
        author_email: email.trim(),
        content: content.trim(),
      });

      toast({
        title: "Comment submitted!",
        description:
          "Your comment has been submitted and is pending moderation.",
      });

      // Reset form
      setName("");
      setEmail("");
      setContent("");

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Failed to submit comment",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your name"
          />
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Your email will not be published.
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="content">Comment *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          placeholder="Write your comment..."
          rows={4}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitComment.isPending}>
          {submitComment.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {parentId ? "Post Reply" : "Post Comment"}
        </Button>

        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
