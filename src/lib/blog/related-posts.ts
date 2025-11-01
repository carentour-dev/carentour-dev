/**
 * Algorithm for finding related blog posts
 * Priority: Category > Tags > Recent
 */

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category_id?: string;
  tags?: Array<{ id: string }>;
  publish_date?: string;
}

/**
 * Calculate similarity score between two posts
 */
function calculateSimilarityScore(
  currentPost: BlogPost,
  otherPost: BlogPost,
): number {
  let score = 0;

  // Same category: +10 points
  if (
    currentPost.category_id &&
    currentPost.category_id === otherPost.category_id
  ) {
    score += 10;
  }

  // Shared tags: +2 points per tag
  if (currentPost.tags && otherPost.tags) {
    const currentTagIds = currentPost.tags.map((t) => t.id);
    const otherTagIds = otherPost.tags.map((t) => t.id);
    const sharedTags = currentTagIds.filter((id) => otherTagIds.includes(id));
    score += sharedTags.length * 2;
  }

  // Recent posts: +1 point for posts from last 30 days
  if (otherPost.publish_date) {
    const publishDate = new Date(otherPost.publish_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (publishDate > thirtyDaysAgo) {
      score += 1;
    }
  }

  return score;
}

/**
 * Find related posts based on similarity
 */
export function findRelatedPosts(
  currentPost: BlogPost,
  allPosts: BlogPost[],
  limit: number = 4,
): BlogPost[] {
  // Filter out current post
  const otherPosts = allPosts.filter((post) => post.id !== currentPost.id);

  // Calculate scores for all posts
  const postsWithScores = otherPosts.map((post) => ({
    post,
    score: calculateSimilarityScore(currentPost, post),
  }));

  // Sort by score (descending) and take top N
  const related = postsWithScores
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If same score, sort by publish date (newest first)
      const dateA = a.post.publish_date
        ? new Date(a.post.publish_date).getTime()
        : 0;
      const dateB = b.post.publish_date
        ? new Date(b.post.publish_date).getTime()
        : 0;
      return dateB - dateA;
    })
    .slice(0, limit)
    .map((item) => item.post);

  return related;
}
