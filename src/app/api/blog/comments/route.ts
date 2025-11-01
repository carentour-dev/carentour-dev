import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/integrations/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("post_id");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    // Get approved comments for the post
    const { data: comments, error } = await supabase
      .from("blog_comments")
      .select(
        `
        id,
        post_id,
        parent_id,
        author_name,
        author_email,
        content,
        created_at
      `,
      )
      .eq("post_id", postId)
      .eq("status", "approved")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 },
      );
    }

    // Organize comments into a tree structure
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create map of all comments
    comments?.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    comments?.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id);
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return NextResponse.json({ comments: rootComments });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { post_id, parent_id, author_name, author_email, content } = body;

    // Validate required fields
    if (!post_id || !author_name || !author_email || !content) {
      return NextResponse.json(
        { error: "Post ID, author name, email, and content are required" },
        { status: 400 },
      );
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(author_email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // Check if the post exists and allows comments
    const { data: post, error: postError } = await supabase
      .from("blog_posts")
      .select("id, enable_comments, status")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status !== "published" || !post.enable_comments) {
      return NextResponse.json(
        { error: "Comments are not allowed on this post" },
        { status: 403 },
      );
    }

    // Get user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Basic spam detection (simple keyword check)
    const spamKeywords = ["viagra", "cialis", "casino", "poker"];
    const hasSpam = spamKeywords.some((keyword) =>
      content.toLowerCase().includes(keyword),
    );

    // Insert comment with pending status (or spam if detected)
    const { data: comment, error: insertError } = await supabase
      .from("blog_comments")
      .insert({
        post_id,
        parent_id: parent_id || null,
        author_name,
        author_email,
        author_user_id: user?.id || null,
        content,
        status: hasSpam ? "spam" : "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating comment:", insertError);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        comment,
        message: "Comment submitted successfully and is pending moderation",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
