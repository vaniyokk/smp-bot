import { google } from 'googleapis';
import type { YouTubeUpdateResult } from '@/types/index.js';
import { appConfig } from '@/config/index.js';

export class YouTubeService {
  private youtube = google.youtube('v3');
  private auth = new google.auth.OAuth2(
    appConfig.youtube.clientId,
    appConfig.youtube.clientSecret
  );

  constructor() {
    this.auth.setCredentials({
      refresh_token: appConfig.youtube.refreshToken,
    });
  }

  async updateVideoDescription(videoId: string, sheetMusicUrl: string): Promise<YouTubeUpdateResult> {
    console.log(`🎥 Updating YouTube video ${videoId} with sheet music link...`);

    try {
      // First, get the current video details
      const currentVideo = await this.youtube.videos.list({
        auth: this.auth,
        part: ['snippet'],
        id: [videoId],
      });

      const video = currentVideo.data.items?.[0];
      if (!video?.snippet) {
        throw new Error(`Video ${videoId} not found or no snippet available`);
      }

      const currentDescription = video.snippet.description || '';
      
      // Check if the sheet music link is already in the description
      if (currentDescription.includes(sheetMusicUrl)) {
        console.log(`ℹ️ Sheet music link already exists in video ${videoId} description`);
        return {
          success: true,
          videoId,
          updatedDescription: currentDescription,
        };
      }

      // Add the sheet music link to the description
      const sheetMusicSection = this.formatSheetMusicSection(sheetMusicUrl);
      const updatedDescription = this.addSheetMusicToDescription(currentDescription, sheetMusicSection);

      // Update the video description
      await this.youtube.videos.update({
        auth: this.auth,
        part: ['snippet'],
        requestBody: {
          id: videoId,
          snippet: {
            ...video.snippet,
            description: updatedDescription,
          },
        },
      });

      console.log(`✅ Successfully updated YouTube video ${videoId} description`);
      
      return {
        success: true,
        videoId,
        updatedDescription,
      };

    } catch (error) {
      console.error(`❌ Failed to update YouTube video ${videoId}:`, error);
      
      return {
        success: false,
        videoId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async batchUpdateVideos(updates: Array<{ videoId: string; sheetMusicUrl: string }>): Promise<YouTubeUpdateResult[]> {
    console.log(`🎬 Batch updating ${updates.length} YouTube videos...`);
    
    const results: YouTubeUpdateResult[] = [];
    
    // Process videos one by one to avoid API rate limits
    for (const update of updates) {
      try {
        const result = await this.updateVideoDescription(update.videoId, update.sheetMusicUrl);
        results.push(result);
        
        // Add a small delay to respect API rate limits
        await this.delay(1000);
        
      } catch (error) {
        results.push({
          success: false,
          videoId: update.videoId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Batch update completed: ${successCount}/${updates.length} successful`);
    
    return results;
  }

  private formatSheetMusicSection(sheetMusicUrl: string): string {
    return `
🎼 **Sheet Music Available!**
Download the sheet music: ${sheetMusicUrl}

---`;
  }

  private addSheetMusicToDescription(currentDescription: string, sheetMusicSection: string): string {
    // Strategy: Add the sheet music section at the beginning of the description
    // This makes it most visible to viewers
    
    if (!currentDescription.trim()) {
      return sheetMusicSection.trim();
    }

    // Check if there's already a sheet music section we should replace
    const existingSheetMusicMatch = currentDescription.match(/🎼[\s\S]*?---/);
    if (existingSheetMusicMatch) {
      return currentDescription.replace(existingSheetMusicMatch[0], sheetMusicSection.trim());
    }

    // Add at the beginning with some spacing
    return `${sheetMusicSection.trim()}\n\n${currentDescription}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async validateVideoExists(videoId: string): Promise<boolean> {
    try {
      const response = await this.youtube.videos.list({
        auth: this.auth,
        part: ['id'],
        id: [videoId],
      });

      return (response.data.items?.length ?? 0) > 0;
      
    } catch (error) {
      console.warn(`⚠️ Could not validate video ${videoId}:`, error);
      return false;
    }
  }

  async getVideoInfo(videoId: string): Promise<{ title?: string | undefined; description?: string | undefined } | null> {
    try {
      const response = await this.youtube.videos.list({
        auth: this.auth,
        part: ['snippet'],
        id: [videoId],
      });

      const video = response.data.items?.[0];
      if (!video?.snippet) {
        return null;
      }

      return {
        title: video.snippet.title ?? undefined,
        description: video.snippet.description ?? undefined,
      };
      
    } catch (error) {
      console.warn(`⚠️ Could not get video info for ${videoId}:`, error);
      return null;
    }
  }
}