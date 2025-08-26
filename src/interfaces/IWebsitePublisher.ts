import type { WebsitePublishResult, NotionSheetMusic, AIGeneratedContent } from '@/types/index.js';

/**
 * Interface for website publishing services
 * Each website implementation must provide these core methods
 */
export interface IWebsitePublisher {
  /**
   * Initialize the website publisher (browser, authentication, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Publish sheet music to the website
   * @param sheetMusic - The sheet music data from Notion
   * @param aiContent - AI-generated content for the listing
   * @returns Promise resolving to publish result with success status and URL
   */
  publishSheetMusic(
    sheetMusic: NotionSheetMusic, 
    aiContent: AIGeneratedContent
  ): Promise<WebsitePublishResult>;

  /**
   * Clean up resources (close browser, etc.)
   */
  cleanup(): Promise<void>;

  /**
   * Get the website name for logging and identification
   */
  getWebsiteName(): string;
}