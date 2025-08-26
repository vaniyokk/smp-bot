import type { IWebsitePublisher } from '@/interfaces/IWebsitePublisher.js';
import type { WebsitePublishResult, NotionSheetMusic, AIGeneratedContent } from '@/types/index.js';
import { Website1Service } from '@/services/websites/Website1Service.js';
import { Website2Service } from '@/services/websites/Website2Service.js';
import { Website3Service } from '@/services/websites/Website3Service.js';

/**
 * Manages publishing to multiple websites
 * Coordinates the publishing process across all configured website services
 */
export class WebsiteManager {
  private websites: IWebsitePublisher[] = [];

  constructor() {
    // Initialize all website services
    this.websites = [
      new Website1Service(),
      new Website2Service(),
      new Website3Service(),
    ];
  }

  /**
   * Initialize all website services
   */
  async initialize(): Promise<void> {
    console.log(`🌐 Initializing ${this.websites.length} website services...`);
    
    const initPromises = this.websites.map(async (website) => {
      try {
        await website.initialize();
        console.log(`✅ ${website.getWebsiteName()} initialized successfully`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${website.getWebsiteName()}:`, error);
        throw error;
      }
    });

    await Promise.all(initPromises);
    console.log(`✅ All ${this.websites.length} website services initialized`);
  }

  /**
   * Publish sheet music to all websites
   */
  async publishToAllWebsites(
    sheetMusic: NotionSheetMusic,
    aiContent: AIGeneratedContent
  ): Promise<{
    results: Array<{
      website: string;
      result: WebsitePublishResult;
    }>;
    successCount: number;
    totalCount: number;
  }> {
    console.log(`🚀 Publishing "${sheetMusic.name}" to ${this.websites.length} websites...`);
    
    const publishPromises = this.websites.map(async (website) => {
      try {
        const result = await website.publishSheetMusic(sheetMusic, aiContent);
        return {
          website: website.getWebsiteName(),
          result,
        };
      } catch (error) {
        console.error(`❌ Failed to publish to ${website.getWebsiteName()}:`, error);
        return {
          website: website.getWebsiteName(),
          result: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          } as WebsitePublishResult,
        };
      }
    });

    const results = await Promise.all(publishPromises);
    const successCount = results.filter(r => r.result.success).length;
    
    console.log(`📊 Publishing summary for "${sheetMusic.name}": ${successCount}/${results.length} successful`);
    
    return {
      results,
      successCount,
      totalCount: results.length,
    };
  }

  /**
   * Publish sheet music to specific websites only
   */
  async publishToSpecificWebsites(
    sheetMusic: NotionSheetMusic,
    aiContent: AIGeneratedContent,
    websiteNames: string[]
  ): Promise<{
    results: Array<{
      website: string;
      result: WebsitePublishResult;
    }>;
    successCount: number;
    totalCount: number;
  }> {
    console.log(`🎯 Publishing "${sheetMusic.name}" to specific websites: ${websiteNames.join(', ')}`);
    
    const selectedWebsites = this.websites.filter(website => 
      websiteNames.includes(website.getWebsiteName())
    );

    if (selectedWebsites.length === 0) {
      console.warn(`⚠️ No matching websites found for: ${websiteNames.join(', ')}`);
      return {
        results: [],
        successCount: 0,
        totalCount: 0,
      };
    }

    const publishPromises = selectedWebsites.map(async (website) => {
      try {
        const result = await website.publishSheetMusic(sheetMusic, aiContent);
        return {
          website: website.getWebsiteName(),
          result,
        };
      } catch (error) {
        console.error(`❌ Failed to publish to ${website.getWebsiteName()}:`, error);
        return {
          website: website.getWebsiteName(),
          result: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          } as WebsitePublishResult,
        };
      }
    });

    const results = await Promise.all(publishPromises);
    const successCount = results.filter(r => r.result.success).length;
    
    console.log(`📊 Targeted publishing summary for "${sheetMusic.name}": ${successCount}/${results.length} successful`);
    
    return {
      results,
      successCount,
      totalCount: results.length,
    };
  }

  /**
   * Get list of available website names
   */
  getAvailableWebsites(): string[] {
    return this.websites.map(website => website.getWebsiteName());
  }

  /**
   * Clean up all website services
   */
  async cleanup(): Promise<void> {
    console.log(`🧹 Cleaning up ${this.websites.length} website services...`);
    
    const cleanupPromises = this.websites.map(async (website) => {
      try {
        await website.cleanup();
        console.log(`✅ ${website.getWebsiteName()} cleanup completed`);
      } catch (error) {
        console.error(`⚠️ Cleanup error for ${website.getWebsiteName()}:`, error);
        // Continue with other cleanups even if one fails
      }
    });

    await Promise.all(cleanupPromises);
    console.log(`✅ All website services cleanup completed`);
  }
}