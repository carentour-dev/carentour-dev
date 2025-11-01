"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, Loader2, X, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BlogPostEditorProps {
  initialData?: any;
  onSave: (data: any, status: "draft" | "published") => Promise<void>;
  saving?: boolean;
}

export function BlogPostEditor({
  initialData,
  onSave,
  saving = false,
}: BlogPostEditorProps) {
  // Basic post data
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [featuredImage, setFeaturedImage] = useState(
    initialData?.featured_image || "",
  );

  // Content
  const [contentType, setContentType] = useState<
    "richtext" | "markdown" | "html"
  >(initialData?.content?.type || "html");
  const [contentData, setContentData] = useState(
    initialData?.content?.data || "",
  );

  // Metadata
  const [categoryId, setCategoryId] = useState(initialData?.category_id || "");
  const [authorId, setAuthorId] = useState(initialData?.author_id || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags?.map((t: any) => t.id) || [],
  );
  const [newTagName, setNewTagName] = useState("");

  // SEO
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(
    initialData?.seo_description || "",
  );
  const [seoKeywords, setSeoKeywords] = useState(
    initialData?.seo_keywords || "",
  );
  const [ogImage, setOgImage] = useState(initialData?.og_image || "");

  // Settings
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [enableComments, setEnableComments] = useState(
    initialData?.enable_comments ?? true,
  );

  // Auto-generate slug from title
  useEffect(() => {
    if (!initialData && title && !slug) {
      const autoSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(autoSlug);
    }
  }, [title, slug, initialData]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/cms/blog/categories", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      return data.categories || [];
    },
  });

  // Fetch authors
  const { data: authors } = useQuery({
    queryKey: ["blog-authors"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/cms/blog/authors", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      return data.authors || [];
    },
  });

  // Fetch tags
  const { data: tags, refetch: refetchTags } = useQuery({
    queryKey: ["blog-tags"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/cms/blog/tags", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      return data.tags || [];
    },
  });

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Generate slug from tag name
      const slug = newTagName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const res = await fetch("/api/cms/blog/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          slug: slug,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedTags([...selectedTags, data.tag.id]);
        setNewTagName("");
        refetchTags();
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter((id) => id !== tagId));
  };

  const handleSave = (status: "draft" | "published") => {
    const postData = {
      id: initialData?.id,
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content: {
        type: contentType,
        data: contentData,
      },
      featured_image: featuredImage.trim(),
      category_id: categoryId || null,
      author_id: authorId || null,
      tags: selectedTags,
      seo_title: seoTitle.trim(),
      seo_description: seoDescription.trim(),
      seo_keywords: seoKeywords.trim(),
      og_image: ogImage.trim() || featuredImage.trim(),
      featured,
      enable_comments: enableComments,
    };

    onSave(postData, status);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Title */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title"
                  className="text-2xl font-bold"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-url-slug"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL: /blog/
                  {categories?.find((c: any) => c.id === categoryId)?.slug ||
                    "category"}
                  /{slug}
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of the post"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Editor */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Content Format</Label>
                <Tabs
                  value={contentType}
                  onValueChange={(v) => setContentType(v as any)}
                >
                  <TabsList>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="markdown">Markdown</TabsTrigger>
                    <TabsTrigger value="richtext">Rich Text</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Simple textarea for now - can be enhanced with Monaco/TipTap later */}
              <Textarea
                value={contentData}
                onChange={(e) => setContentData(e.target.value)}
                placeholder={
                  contentType === "html"
                    ? "Enter HTML content..."
                    : contentType === "markdown"
                      ? "Enter Markdown content..."
                      : "Enter content..."
                }
                rows={20}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {contentType === "html" && "Use HTML tags for formatting"}
                {contentType === "markdown" &&
                  "Use Markdown syntax for formatting"}
                {contentType === "richtext" && "Plain text content"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SEO Section */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="seo-title">SEO Title</Label>
                <Input
                  id="seo-title"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Leave empty to use post title"
                />
              </div>

              <div>
                <Label htmlFor="seo-description">SEO Description</Label>
                <Textarea
                  id="seo-description"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Meta description for search engines"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="seo-keywords">Keywords (comma-separated)</Label>
                <Input
                  id="seo-keywords"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div>
                <Label htmlFor="og-image">Open Graph Image URL</Label>
                <Input
                  id="og-image"
                  type="url"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="Leave empty to use featured image"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Publish Actions */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Button
              onClick={() => handleSave("published")}
              disabled={saving || !title || !slug}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Publish
                </>
              )}
            </Button>
            <Button
              onClick={() => handleSave("draft")}
              disabled={saving || !title || !slug}
              variant="outline"
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Category */}
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Author */}
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="author">Author</Label>
            <Select value={authorId} onValueChange={setAuthorId}>
              <SelectTrigger id="author">
                <SelectValue placeholder="Select author" />
              </SelectTrigger>
              <SelectContent>
                {authors?.map((author: any) => (
                  <SelectItem key={author.id} value={author.id}>
                    {author.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Add new tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button onClick={handleAddTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags
                ?.filter((tag: any) => selectedTags.includes(tag.id))
                .map((tag: any) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                    <button
                      onClick={() => handleRemoveTag(tag.id)}
                      className="ml-2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
            </div>
            <Select
              value=""
              onValueChange={(value) => {
                if (!selectedTags.includes(value)) {
                  setSelectedTags([...selectedTags, value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select existing tag" />
              </SelectTrigger>
              <SelectContent>
                {tags
                  ?.filter((tag: any) => !selectedTags.includes(tag.id))
                  .map((tag: any) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Featured Image */}
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="featured-image">Featured Image URL</Label>
            <Input
              id="featured-image"
              type="url"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {featuredImage && (
              <div className="relative mt-2 w-full h-32">
                <Image
                  src={featuredImage}
                  alt="Preview"
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Post Settings */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="featured">Featured Post</Label>
                <p className="text-xs text-muted-foreground">
                  Show in featured section
                </p>
              </div>
              <Switch
                id="featured"
                checked={featured}
                onCheckedChange={setFeatured}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="comments">Enable Comments</Label>
                <p className="text-xs text-muted-foreground">
                  Allow readers to comment
                </p>
              </div>
              <Switch
                id="comments"
                checked={enableComments}
                onCheckedChange={setEnableComments}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
