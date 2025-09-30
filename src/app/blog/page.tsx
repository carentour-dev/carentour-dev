"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ArrowRight, Heart, Stethoscope, Plane } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Blog() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const blogPosts = [
    {
      id: 1,
      title: "Complete Guide to Medical Tourism in Egypt: What You Need to Know",
      excerpt: "Discover everything about medical tourism in Egypt, from choosing the right hospital to understanding the process and costs involved.",
      category: "Medical Tourism",
      author: "Dr. Sarah Ahmed",
      readTime: "8 min read",
      date: "March 15, 2024",
      image: "/blog-medical-tourism.jpg",
      featured: true
    },
    {
      id: 2,
      title: "LASIK Surgery in Egypt: Advanced Technology at Affordable Prices",
      excerpt: "Learn about the latest LASIK technology available in Egypt and why thousands choose Egyptian eye clinics for vision correction.",
      category: "Eye Surgery",
      author: "Dr. Mohamed Hassan",
      readTime: "6 min read",
      date: "March 12, 2024",
      image: "/blog-lasik-surgery.jpg"
    },
    {
      id: 3,
      title: "Cardiac Surgery Excellence: Egypt&apos;s World-Class Heart Centers",
      excerpt: "Explore Egypt&apos;s leading cardiac surgery facilities and the internationally trained surgeons performing life-saving procedures.",
      category: "Cardiac Surgery",
      author: "Dr. Amira Farouk",
      readTime: "10 min read",
      date: "March 10, 2024",
      image: "/blog-cardiac-surgery.jpg"
    },
    {
      id: 4,
      title: "Dental Tourism: Why Egypt is Becoming the Top Destination",
      excerpt: "From dental implants to cosmetic dentistry, discover why Egypt offers the perfect combination of quality and affordability.",
      category: "Dental Care",
      author: "Dr. Ahmed Mahmoud",
      readTime: "7 min read",
      date: "March 8, 2024",
      image: "/blog-dental-care.jpg"
    },
    {
      id: 5,
      title: "Recovery and Wellness: Making the Most of Your Medical Trip",
      excerpt: "Tips for a smooth recovery while exploring Egypt&apos;s rich culture and history during your medical tourism journey.",
      category: "Wellness",
      author: "Fatima El-Sayed",
      readTime: "5 min read",
      date: "March 5, 2024",
      image: "/blog-wellness-recovery.jpg"
    },
    {
      id: 6,
      title: "Understanding Medical Insurance and International Coverage",
      excerpt: "Navigate the complexities of medical insurance for international treatments and learn about coverage options.",
      category: "Insurance",
      author: "Omar Rashid",
      readTime: "9 min read",
      date: "March 3, 2024",
      image: "/blog-medical-insurance.jpg"
    }
  ];

  const categories = [
    { name: "All", icon: Stethoscope },
    { name: "Medical Tourism", icon: Plane },
    { name: "Cardiac Surgery", icon: Heart },
    { name: "Eye Surgery", icon: "👁️" },
    { name: "Dental Care", icon: "🦷" },
    { name: "Wellness", icon: "🧘" },
    { name: "Insurance", icon: "📋" }
  ];

  const featuredPost = blogPosts.find(post => post.featured);
  const allPosts = blogPosts.filter(post => !post.featured);
  
  // Filter posts based on selected category
  const filteredPosts = selectedCategory === "All" 
    ? allPosts 
    : allPosts.filter(post => post.category === selectedCategory);

  // Update category counts based on actual posts
  const getCategoryCount = (categoryName: string) => {
    if (categoryName === "All") return blogPosts.length;
    return blogPosts.filter(post => post.category === categoryName).length;
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">Medical Tourism Blog</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Health Insights & 
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Travel Guides
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Expert insights, patient stories, and comprehensive guides to help you make 
                informed decisions about your medical tourism journey to Egypt.
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((category, index) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.name;
                const count = getCategoryCount(category.name);
                
                return (
                  <Button
                    key={index}
                    variant={isActive ? "default" : "outline"}
                    className="flex items-center space-x-2"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    {typeof Icon === "string" ? (
                      <span className="text-lg">{Icon}</span>
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span>{category.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {count}
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
                  <Badge variant="secondary" className="mb-4">Featured Article</Badge>
                  <h2 className="text-2xl font-bold text-foreground">Editor&apos;s Pick</h2>
                </div>
                
                <Card className="border-border/50 overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="relative aspect-video lg:aspect-square bg-muted overflow-hidden">
                      <Image
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 40vw, 100vw"
                        priority
                      />
                    </div>
                    <CardContent className="p-8 flex flex-col justify-center">
                      <Badge variant="outline" className="w-fit mb-4">
                        {featuredPost.category}
                      </Badge>
                      <CardTitle className="text-2xl mb-4">
                        {featuredPost.title}
                      </CardTitle>
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{featuredPost.author}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{featuredPost.readTime}</span>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{featuredPost.date}</span>
                      </div>
                      <Button 
                        className="w-fit"
                        onClick={() => router.push(`/blog/${featuredPost.id}`)}
                      >
                        Read Full Article
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Blog Posts Grid */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {selectedCategory === "All" ? "Latest Articles" : `${selectedCategory} Articles`}
              </h2>
              <p className="text-xl text-muted-foreground">
                Stay informed with our latest insights and guides
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                <Card key={post.id} className="border-border/50 hover:shadow-card-hover transition-spring overflow-hidden">
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
                    />
                  </div>
                  <CardHeader>
                    <Badge variant="outline" className="w-fit mb-2">
                      {post.category}
                    </Badge>
                    <CardTitle className="text-lg leading-tight">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      <span>{post.date}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => router.push(`/blog/${post.id}`)}
                    >
                      Read More
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No articles found in the {selectedCategory} category.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSelectedCategory("All")}
                >
                  View All Articles
                </Button>
              </div>
            )}
            </div>

            {filteredPosts.length > 0 && (
              <div className="text-center mt-12">
                <Button size="lg" variant="outline">
                  Load More Articles
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
              Subscribe to our newsletter for the latest medical tourism news, health tips, and exclusive insights
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
};

