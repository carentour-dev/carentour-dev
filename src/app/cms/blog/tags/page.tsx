"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Plus,
  Edit3,
  Trash2,
  Loader2,
  Tag as TagIcon,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function TagsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: tags, isLoading } = useQuery({
    queryKey: ["blog-tags-cms"],
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

  const filteredTags = tags?.filter((tag: any) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenDialog = (tag?: any) => {
    setEditingTag(tag || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingTag(null);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tags</h1>
          <p className="text-muted-foreground mt-1">
            Manage tags for your blog posts
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingTag(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              New Tag
            </Button>
          </DialogTrigger>
          <TagDialog tag={editingTag} onClose={handleCloseDialog} />
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tags..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : filteredTags && filteredTags.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredTags.map((tag: any) => (
                <TagRow
                  key={tag.id}
                  tag={tag}
                  onEdit={() => handleOpenDialog(tag)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <TagIcon className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "No tags found matching your search."
                : "No tags yet. Create your first tag!"}
            </p>
            {!searchTerm && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Tag
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TagRow({ tag, onEdit }: { tag: any; onEdit: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/cms/blog/tags?id=${tag.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error("Failed to delete tag");
      }

      toast({
        title: "Tag deleted",
        description: `"${tag.name}" has been deleted.`,
      });

      queryClient.invalidateQueries({ queryKey: ["blog-tags-cms"] });
      queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Could not delete tag. It may have associated posts.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-muted-foreground" />
          <p className="font-semibold text-foreground truncate">{tag.name}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground truncate">
          /blog/tag/{tag.slug}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{tag.post_count} posts</Badge>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit3 className="mr-2 h-3.5 w-3.5" />
          Edit
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={deleting}>
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this tag?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Posts with this tag will be
                unaffected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function TagDialog({ tag, onClose }: { tag?: any; onClose: () => void }) {
  const initialName = tag?.name || "";
  const initialSlug = tag?.slug || "";

  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [autoSlug, setAutoSlug] = useState(!tag);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(tag?.name || "");
    setSlug(tag?.slug || "");
    setAutoSlug(!tag?.id);
  }, [tag?.id, tag?.name, tag?.slug]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (autoSlug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const payload = {
        id: tag?.id,
        name: name.trim(),
        slug: slug.trim(),
      };

      const res = await fetch("/api/cms/blog/tags", {
        method: tag ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save tag");
      }

      toast({
        title: tag ? "Tag updated" : "Tag created",
        description: `"${name}" has been saved successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: ["blog-tags-cms"] });
      queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const hasUnsavedChanges =
    name.trim() !== initialName || slug.trim() !== initialSlug;

  const handleClose = () => {
    if (!hasUnsavedChanges || window.confirm("Discard unsaved changes?")) {
      onClose();
    }
  };

  return (
    <DialogContent className="max-w-md" unsaved={hasUnsavedChanges}>
      <DialogHeader>
        <DialogTitle>{tag ? "Edit Tag" : "Create Tag"}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="e.g., Cardiology"
          />
        </div>

        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setAutoSlug(false);
            }}
            required
            placeholder="e.g., cardiology"
          />
          <p className="text-xs text-muted-foreground mt-1">
            URL-friendly identifier. Auto-generated from name.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-4">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tag ? "Save" : "Create"}
          </Button>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
