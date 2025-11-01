"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CommentForm } from "./CommentForm";
import { BlogComment } from "@/hooks/useBlogComments";

interface CommentThreadProps {
  comments: BlogComment[];
  postId: string;
}

export function CommentThread({ comments, postId }: CommentThreadProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} postId={postId} />
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  postId,
  depth = 0,
}: {
  comment: BlogComment;
  postId: string;
  depth?: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplySuccess = () => {
    setShowReplyForm(false);
  };

  return (
    <div className={depth > 0 ? "ml-8 md:ml-12" : ""}>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-foreground">
                {comment.author_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <p className="text-sm text-foreground leading-relaxed mb-3 whitespace-pre-wrap">
              {comment.content}
            </p>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="h-8 px-3"
            >
              <MessageSquare className="h-3 w-3 mr-2" />
              Reply
            </Button>
          </div>
        </div>

        {showReplyForm && (
          <div className="mt-4 ml-13">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onSuccess={handleReplySuccess}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </Card>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
