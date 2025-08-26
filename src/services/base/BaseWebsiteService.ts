import { chromium, type Browser, type Page } from '@playwright/test';
import { writeFileSync } from 'fs';
import type { WebsitePublishResult, NotionSheetMusic, AIGeneratedContent } from '@/types/index.js';
import type { IWebsitePublisher } from '@/interfaces/IWebsitePublisher.js';
import { appConfig } from '@/config/index.js';

/**
 * Abstract base class for website publishing services
 * Provides common functionality like browser management, file handling, screenshots
 */
export abstract class BaseWebsiteService implements IWebsitePublisher {
  protected browser?: Browser | undefined;
  protected page?: Page | undefined;

  async initialize(): Promise<void> {
    console.log(`🎭 Initializing browser for ${this.getWebsiteName()}...`);
    
    this.browser = await chromium.launch({
      headless: appConfig.playwright.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(appConfig.playwright.timeout);
    
    console.log(`✅ Browser initialized for ${this.getWebsiteName()}`);
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      console.log(`🧹 Cleaning up browser for ${this.getWebsiteName()}...`);
      await this.browser.close();
      this.browser = undefined;
      this.page = undefined;
      console.log(`✅ Browser cleanup completed for ${this.getWebsiteName()}`);
    }
  }

  /**
   * Common method to take screenshots for debugging
   */
  protected async takeScreenshot(name: string, screenshots: string[]): Promise<void> {
    if (!this.page) return;

    try {
      const filename = `screenshots/${this.getWebsiteName().toLowerCase()}-${name}-${Date.now()}.png`;
      await this.page.screenshot({ path: filename, fullPage: true });
      screenshots.push(filename);
      console.log(`📸 Screenshot saved: ${filename}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Failed to take screenshot: ${errorMsg}`);
    }
  }

  /**
   * Common method to download and temporarily save files
   */
  protected async downloadFile(url: string, fileName: string): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`📥 Downloading file from: ${url}`);
    
    const response = await this.page.request.get(url);
    const buffer = await response.body();
    
    const tempPath = `/tmp/${fileName}`;
    writeFileSync(tempPath, buffer);
    
    console.log(`✅ File downloaded to: ${tempPath}`);
    return tempPath;
  }

  /**
   * Common method to wait for page navigation
   */
  protected async waitForNavigation(): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.waitForLoadState('networkidle');
  }

  // Abstract methods that each website must implement
  abstract publishSheetMusic(
    sheetMusic: NotionSheetMusic, 
    aiContent: AIGeneratedContent
  ): Promise<WebsitePublishResult>;

  abstract getWebsiteName(): string;

  // Protected abstract methods for website-specific logic
  protected abstract login(): Promise<void>;
  protected abstract navigateToPublishForm(): Promise<void>;
  protected abstract fillPublishForm(
    sheetMusic: NotionSheetMusic, 
    aiContent: AIGeneratedContent
  ): Promise<void>;
  protected abstract uploadFile(file: { url: string; name: string }): Promise<void>;
  protected abstract submitForm(): Promise<string>;
}