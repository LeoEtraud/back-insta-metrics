import type { Response } from "express";
import { storage } from "../storage";
import { POST_TYPES } from "../shared/schema";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../middlewares/auth";

export const getPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    return res.status(400).json({ message: "User not associated with a company" });
  }

  const posts = await storage.getPosts(companyId);
  res.json(posts);
});

export const syncPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  // In a real app, this would use the access token to fetch data from Graph API
  // Here we will just seed some realistic data if it doesn't exist
  const companyId = req.user?.companyId;
  if (!companyId) {
    return res.status(400).json({ message: "User not associated with a company" });
  }
  
  await seedCompanyData(companyId);
  res.json({ message: "Synced successfully", count: 10 });
});

// Seed function to populate data for demo
async function seedCompanyData(companyId: number) {
  const existingPosts = await storage.getPosts(companyId);
  if (existingPosts.length > 0) return; // Already seeded

  // Seed Daily Metrics
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    await storage.createDailyMetric({
      companyId,
      date,
      followersCount: 1200 + (30 - i) * 5 + Math.floor(Math.random() * 10), // Gradual growth
      reach: 500 + Math.floor(Math.random() * 200),
      impressions: 800 + Math.floor(Math.random() * 300),
      profileViews: 50 + Math.floor(Math.random() * 20),
    });
  }

  // Seed Posts
  const postTypes = [POST_TYPES.IMAGE, POST_TYPES.VIDEO, POST_TYPES.REELS, POST_TYPES.CAROUSEL_ALBUM];
  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i * 2);

    await storage.createPost({
      companyId,
      instagramId: `post_${companyId}_${i}`,
      mediaType: postTypes[Math.floor(Math.random() * postTypes.length)],
      caption: `This is an amazing post about our product! #${i}`,
      permalink: `https://instagram.com/p/post_${i}`,
      timestamp: date,
      metrics: {
        likes: 50 + Math.floor(Math.random() * 100),
        comments: 5 + Math.floor(Math.random() * 20),
        shares: Math.floor(Math.random() * 10),
        saves: Math.floor(Math.random() * 5),
        reach: 200 + Math.floor(Math.random() * 500),
      }
    });
  }
}

