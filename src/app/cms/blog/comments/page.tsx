"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  X,
  Trash2,
  Loader2,
  MessageSquare,
  User,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function CommentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["blog-comments-cms", statusFilter],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const params = new URLSearchParams({ limit: "1000" });
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const res = await fetch(`/api/cms/blog/comments?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      return data.comments || [];
    },
  });

  const stats = {
    pending: data?.filter((c: any) => c.status === "pending").length || 0,
    approved: data?.filter((c: any) => c.status === "approved").length || 0,
    spam: data?.filter((c: any) => c.status === "spam").length || 0,
    rejected: data?.filter((c: any) => c.status === "rejected").length || 0,
  };

  const handleUpdateStatus = async (commentId: string, status: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/cms/blog/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error("Failed to update comment");
      }

      toast({
        title: "Comment updated",
        description: `Comment marked as ${status}.`,
      });

      refetch();
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not update comment status.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/cms/blog/comments/${commentId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error("Failed to delete comment");
      }

      toast({
        title: "Comment deleted",
        description: "The comment has been permanently deleted.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Could not delete comment.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Comments Moderation
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and moderate blog post comments
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {stats.pending}
            </div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/40 bg-green-500/10">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {stats.approved}
            </div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/40 bg-red-500/10">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {stats.spam}
            </div>
            <p className="text-sm text-muted-foreground">Spam</p>
          </CardContent>
        </Card>
        <Card className="border-gray-500/40 bg-gray-500/10">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {stats.rejected}
            </div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="pending">
                Pending
                {stats.pending > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {stats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="spam">Spam</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((comment: any) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">
              {statusFilter === "all"
                ? "No comments yet."
                : `No ${statusFilter} comments.`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CommentCard({
  comment,
  onUpdateStatus,
  onDelete,
}: {
  comment: any;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    approved: "bg-green-500/10 text-green-700 dark:text-green-400",
    spam: "bg-red-500/10 text-red-700 dark:text-red-400",
    rejected: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  };

  const handleAction = async (action: () => void) => {
    setLoading(true);
    await action();
    setLoading(false);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">
                    {comment.author_name}
                  </span>
                  <Badge className={statusColors[comment.status] || ""}>
                    {comment.status}
                  </Badge>
                  {comment.status === "spam" && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {comment.author_email}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Post Info */}
          {comment.post && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              <span>On post:</span>
              <Link
                href={`/cms/blog/posts/${comment.post.id}/edit`}
                className="font-medium text-primary hover:underline truncate"
              >
                {comment.post.title}
              </Link>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </div>
          )}

          {/* Content */}
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {comment.status !== "approved" && (
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={() =>
                  handleAction(() => onUpdateStatus(comment.id, "approved"))
                }
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </>
                )}
              </Button>
            )}

            {comment.status !== "spam" && (
              <Button
                size="sm"
                variant="outline"
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                onClick={() =>
                  handleAction(() => onUpdateStatus(comment.id, "spam"))
                }
                disabled={loading}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Mark Spam
              </Button>
            )}

            {comment.status !== "rejected" && (
              <Button
                size="sm"
                variant="outline"
                className="text-gray-600 hover:text-gray-700"
                onClick={() =>
                  handleAction(() => onUpdateStatus(comment.id, "rejected"))
                }
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            )}

            <div className="flex-1" />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={loading}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The comment will be
                    permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleAction(() => onDelete(comment.id))}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
