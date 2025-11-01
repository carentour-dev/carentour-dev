"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit3,
  Trash2,
  Loader2,
  User,
  Link as LinkIcon,
  Twitter,
  Linkedin,
  Github,
  Globe,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AuthorsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<any>(null);
  const [filterActive, setFilterActive] = useState<string>("all");
  const { toast } = useToast();

  const { data: authors, isLoading } = useQuery({
    queryKey: ["blog-authors-cms"],
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

  const filteredAuthors = authors?.filter((author: any) => {
    if (filterActive === "all") return true;
    if (filterActive === "active") return author.active;
    if (filterActive === "inactive") return !author.active;
    return true;
  });

  const handleOpenDialog = (author?: any) => {
    setEditingAuthor(author || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingAuthor(null);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Authors</h1>
          <p className="text-muted-foreground mt-1">
            Manage blog post authors and their profiles
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              New Author
            </Button>
          </DialogTrigger>
          <AuthorDialog author={editingAuthor} onClose={handleCloseDialog} />
        </Dialog>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={filterActive} onValueChange={setFilterActive}>
            <TabsList>
              <TabsTrigger value="all">All Authors</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Authors Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filteredAuthors && filteredAuthors.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAuthors.map((author: any) => (
            <AuthorCard
              key={author.id}
              author={author}
              onEdit={() => handleOpenDialog(author)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No authors found. Create your first author!
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Author
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AuthorCard({ author, onEdit }: { author: any; onEdit: () => void }) {
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

      const res = await fetch(`/api/cms/blog/authors?id=${author.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error("Failed to delete author");
      }

      toast({
        title: "Author deleted",
        description: `"${author.name}" has been deleted.`,
      });

      queryClient.invalidateQueries({ queryKey: ["blog-authors-cms"] });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Could not delete author. They may have associated posts.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          {author.avatar ? (
            <Image
              src={author.avatar}
              alt={author.name}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate">
              {author.name}
            </h3>
            {author.user_id && author.user_email && (
              <p className="text-xs text-muted-foreground truncate">
                <LinkIcon className="inline h-3 w-3 mr-1" />
                Linked to {author.user_email}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={author.active ? "default" : "secondary"}>
                {author.active ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">{author.post_count || 0} posts</Badge>
            </div>
          </div>
        </div>

        {author.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {author.bio}
          </p>
        )}

        {/* Social Links */}
        {(author.website ||
          author.social_links?.twitter ||
          author.social_links?.linkedin ||
          author.social_links?.github) && (
          <div className="flex items-center gap-2">
            {author.website && (
              <a
                href={author.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
            {author.social_links?.twitter && (
              <a
                href={author.social_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {author.social_links?.linkedin && (
              <a
                href={author.social_links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {author.social_links?.github && (
              <a
                href={author.social_links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
          >
            <Edit3 className="mr-2 h-3 w-3" />
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this author?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Posts by this author will remain
                  but be unassigned.
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
      </CardContent>
    </Card>
  );
}

function AuthorDialog({
  author,
  onClose,
}: {
  author?: any;
  onClose: () => void;
}) {
  const [authorType, setAuthorType] = useState<"standalone" | "linked">(
    author?.user_id ? "linked" : "standalone",
  );
  const [userId, setUserId] = useState(author?.user_id || "");
  const [name, setName] = useState(author?.name || "");
  const [email, setEmail] = useState(author?.email || "");
  const [bio, setBio] = useState(author?.bio || "");
  const [avatar, setAvatar] = useState(author?.avatar || "");
  const [website, setWebsite] = useState(author?.website || "");
  const [twitter, setTwitter] = useState(author?.social_links?.twitter || "");
  const [linkedin, setLinkedin] = useState(
    author?.social_links?.linkedin || "",
  );
  const [github, setGithub] = useState(author?.social_links?.github || "");
  const [active, setActive] = useState(author?.active ?? true);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  // Fetch users for linking
  const { data: users } = useQuery({
    queryKey: ["users-for-authors"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/admin/accounts", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      return data.accounts || [];
    },
    enabled: authorType === "linked",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const payload = {
        id: author?.id,
        user_id: authorType === "linked" ? userId : null,
        name: name.trim(),
        email: email.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
        website: website.trim(),
        social_links: {
          twitter: twitter.trim(),
          linkedin: linkedin.trim(),
          github: github.trim(),
        },
        active,
      };

      const url = "/api/cms/blog/authors";
      const method = author ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save author");
      }

      toast({
        title: author ? "Author updated" : "Author created",
        description: `"${name}" has been saved successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: ["blog-authors-cms"] });
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

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{author ? "Edit Author" : "Create Author"}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Author Type */}
        {!author && (
          <div>
            <Label>Author Type</Label>
            <Tabs
              value={authorType}
              onValueChange={(v) => setAuthorType(v as any)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="standalone">Standalone</TabsTrigger>
                <TabsTrigger value="linked">Link to User</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground mt-1">
              {authorType === "standalone"
                ? "Create an independent author profile"
                : "Link to an existing user account"}
            </p>
          </div>
        )}

        {/* Link User */}
        {authorType === "linked" && (
          <div>
            <Label htmlFor="user">User Account *</Label>
            <Select value={userId} onValueChange={setUserId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Name */}
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Author's full name"
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="author@example.com"
          />
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Author bio and background"
            rows={3}
          />
        </div>

        {/* Avatar URL */}
        <div>
          <Label htmlFor="avatar">Avatar URL</Label>
          <Input
            id="avatar"
            type="url"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />
        </div>

        {/* Website */}
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://author-website.com"
          />
        </div>

        {/* Social Links */}
        <div className="space-y-3">
          <Label>Social Links</Label>
          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <Twitter className="h-4 w-4 text-muted-foreground" />
              <Input
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://twitter.com/username"
              />
            </div>
            <div className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-muted-foreground" />
              <Input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="flex items-center gap-2">
              <Github className="h-4 w-4 text-muted-foreground" />
              <Input
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="active">Active Status</Label>
            <p className="text-xs text-muted-foreground">
              Inactive authors won&apos;t appear publicly
            </p>
          </div>
          <Switch id="active" checked={active} onCheckedChange={setActive} />
        </div>

        <div className="flex items-center gap-2 pt-4">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {author ? "Update" : "Create"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
