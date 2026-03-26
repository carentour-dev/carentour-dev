"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const { data: categoriesData } = useBlogCategories();
  const categories = categoriesData || [];

  const { data: postsData, isLoading } = useBlogPosts({
    category: selectedCategory,
    search: searchTerm,
    page,
    limit: 12,
  });

  const posts = postsData?.posts || [];
  const pagination = postsData?.pagination;
  const featuredPost = posts.find((p: any) => p.featured);
  const regularPosts = posts.filter(
    (p: any) => !p.featured || p.id !== featuredPost?.id,
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleCategoryChange = (categoryId?: string) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const oldStaticPosts = [
    {
      id: 1,
      title:
        "Complete Guide to Medical Tourism in Egypt: What You Need to Know",
      excerpt:
        "Discover everything about medical tourism in Egypt, from choosing the right hospital to understanding the process and costs involved.",
      category: "Medical Tourism",
      author: "Dr. Sarah Ahmed",
      readTime: "8 min read",
      date: "March 15, 2024",
      image: "/blog-medical-tourism.jpg",
      featured: true,
    },
    {
      id: 2,
      title: "LASIK Surgery in Egypt: Advanced Technology at Affordable Prices",
      excerpt:
        "Learn about the latest LASIK technology available in Egypt and why thousands choose Egyptian eye clinics for vision correction.",
      category: "Eye Surgery",
      author: "Dr. Mohamed Hassan",
      readTime: "6 min read",
      date: "March 12, 2024",
      image: "/blog-lasik-surgery.jpg",
    },
    {
      id: 3,
      title:
        "Cardiac Surgery Excellence: Egypt&apos;s World-Class Heart Centers",
      excerpt:
        "Explore Egypt&apos;s leading cardiac surgery service providers and the internationally trained surgeons performing life-saving procedures.",
      category: "Cardiac Surgery",
      author: "Dr. Amira Farouk",
      readTime: "10 min read",
      date: "March 10, 2024",
      image: "/blog-cardiac-surgery.jpg",
    },
    {
      id: 4,
      title: "Dental Tourism: Why Egypt is Becoming the Top Destination",
      excerpt:
        "From dental implants to cosmetic dentistry, discover why Egypt offers the perfect combination of quality and affordability.",
      category: "Dental Care",
      author: "Dr. Ahmed Mahmoud",
      readTime: "7 min read",
      date: "March 8, 2024",
      image: "/blog-dental-care.jpg",
    },
    {
      id: 5,
      title: "Recovery and Wellness: Making the Most of Your Medical Trip",
      excerpt:
        "Tips for a smooth recovery while exploring Egypt&apos;s rich culture and history during your medical tourism journey.",
      category: "Wellness",
      author: "Fatima El-Sayed",
      readTime: "5 min read",
      date: "March 5, 2024",
      image: "/blog-wellness-recovery.jpg",
    },
    {
      id: 6,
      title: "Understanding Medical Insurance and International Coverage",
      excerpt:
        "Navigate the complexities of medical insurance for international treatments and learn about coverage options.",
      category: "Insurance",
      author: "Omar Rashid",
      readTime: "9 min read",
      date: "March 3, 2024",
      image: "/blog-medical-insurance.jpg",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">
                Medical Tourism Blog
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Health Insights &
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Travel Guides
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Expert insights, patient stories, and comprehensive guides to
                help you make informed decisions about your medical tourism
                journey to Egypt.
              </p>
            </div>
          </div>
        </section>

        {/* Search & Categories */}
        <section className="py-12 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search articles..."
                  className="pl-10"
                />
              </div>
            </form>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                onClick={() => handleCategoryChange(undefined)}
              >
                All
                <Badge variant="secondary" className="ml-2">
                  {pagination?.total || 0}
                </Badge>
              </Button>
              {categories.map((category) => {
                const isActive = selectedCategory === category.id;
                return (
                  <Button
                    key={category.id}
                    variant={isActive ? "default" : "outline"}
                    className="flex items-center space-x-2"
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    <span>{category.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {category.post_count || 0}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                  <Badge variant="secondary" className="mb-4">
                    Featured Article
                  </Badge>
                  <h2 className="text-2xl font-bold text-foreground">
                    Editor&apos;s Pick
                  </h2>
                </div>

                <BlogPostCard post={featuredPost} />
              </div>
            </div>
          </section>
        )}

        {/* Blog Posts Grid */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {searchTerm
                  ? `Search Results: "${searchTerm}"`
                  : selectedCategory
                    ? `${categories.find((c) => c.id === selectedCategory)?.name} Articles`
                    : "Latest Articles"}
              </h2>
              <p className="text-xl text-muted-foreground">
                Stay informed with our latest insights and guides
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[400px]" />
                ))}
              </div>
            ) : regularPosts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {regularPosts.map((post: any) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPage((p) => Math.min(pagination.totalPages, p + 1))
                      }
                      disabled={page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {searchTerm
                    ? `No articles found matching "${searchTerm}"`
                    : "No articles found."}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSelectedCategory(undefined);
                    setSearchTerm("");
                    setSearchInput("");
                    setPage(1);
                  }}
                >
                  View All Articles
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Stay Updated with Health Insights
            </h2>
            <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter for the latest medical tourism news,
              health tips, and exclusive insights
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-background/20 bg-background/10 text-background placeholder:text-background/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <Button variant="accent" size="lg">
                Subscribe
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
