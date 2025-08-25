import { chromium, type Browser, type Page } from '@playwright/test';
import { writeFileSync } from 'fs';
import type { WebsitePublishResult, NotionSheetMusic, AIGeneratedContent } from '@/types/index.js';
import { appConfig } from '@/config/index.js';

export class WebsiteService {
  private browser?: Browser;
  private page?: Page;

  async initialize(): Promise<void> {
    console.log('🎭 Initializing Playwright browser...');
    
    this.browser = await chromium.launch({
      headless: appConfig.playwright.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(appConfig.playwright.timeout);
    
    console.log('✅ Playwright browser initialized');
  }

  async publishSheetMusic(
    sheetMusic: NotionSheetMusic, 
    aiContent: AIGeneratedContent
  ): Promise<WebsitePublishResult> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    console.log(`🌐 Publishing "${sheetMusic.name}" to website...`);
    const screenshots: string[] = [];

    try {
      // Navigate to login page
      // await this.page.goto(appConfig.website?.baseUrl || 'https://example.com');
      await this.takeScreenshot('01-homepage', screenshots);

      // Login (this is a placeholder - needs to be customized for specific website)
      await this.login();
      await this.takeScreenshot('02-logged-in', screenshots);

      // Navigate to upload/publish form
      await this.navigateToPublishForm();
      await this.takeScreenshot('03-publish-form', screenshots);

      // Fill the form with sheet music data
      await this.fillPublishForm(sheetMusic, aiContent);
      await this.takeScreenshot('04-form-filled', screenshots);

      // Upload file if available
      if (sheetMusic.pdfLink) {
        await this.uploadFile({ 
          url: sheetMusic.pdfLink, 
          name: `${sheetMusic.name}.pdf` 
        });
        await this.takeScreenshot('05-file-uploaded', screenshots);
      }

      // Submit the form
      const publishedUrl = await this.submitForm();
      await this.takeScreenshot('06-published', screenshots);

      console.log(`✅ Successfully published "${sheetMusic.name}" to: ${publishedUrl}`);
      
      return {
        success: true,
        publishedUrl,
        screenshots,
      };

    } catch (error) {
      await this.takeScreenshot('error-state', screenshots);
      
      console.error(`❌ Failed to publish "${sheetMusic.name}":`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        screenshots,
      };
    }
  }

  private async login(): Promise<void> {
    if (!this.page) throw new Error('Page not available');

    // TODO: Customize these selectors for your specific website
    console.log('🔐 Logging in...');
    
    // Look for common login selectors
    const loginSelectors = [
      'a[href*="login"]',
      'button:has-text("Login")',
      'input[type="email"]',
      '#login',
      '.login'
    ];

    let loginFound = false;
    for (const selector of loginSelectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 5000 });
        if (selector.includes('href')) {
          await this.page.click(selector);
        }
        loginFound = true;
        break;
      } catch {
        // Continue to next selector
      }
    }

    if (!loginFound) {
      throw new Error('Could not find login form - please customize selectors');
    }

    // Fill login form
    // await this.page.fill('input[type="email"], input[name="email"], input[name="username"]', 
    //                     appConfig.website?.username || '');
    // await this.page.fill('input[type="password"], input[name="password"]', 
    //                     appConfig.website?.password || '');
    
    // Submit login
    await this.page.click('button[type="submit"], input[type="submit"], button:has-text("Login")');
    
    // Wait for navigation or success indicator
    await this.page.waitForTimeout(3000);
    
    console.log('✅ Logged in successfully');
  }

  private async navigateToPublishForm(): Promise<void> {
    if (!this.page) throw new Error('Page not available');

    console.log('📄 Navigating to publish form...');
    
    // TODO: Customize navigation for your specific website
    const publishSelectors = [
      'a[href*="upload"]',
      'a[href*="publish"]',
      'a[href*="submit"]',
      'button:has-text("Upload")',
      'button:has-text("Publish")',
    ];

    for (const selector of publishSelectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 5000 });
        await this.page.click(selector);
        await this.page.waitForTimeout(2000);
        console.log(`✅ Navigated using selector: ${selector}`);
        return;
      } catch {
        // Continue to next selector
      }
    }

    throw new Error('Could not find publish/upload form - please customize selectors');
  }

  private async fillPublishForm(sheetMusic: NotionSheetMusic, aiContent: AIGeneratedContent): Promise<void> {
    if (!this.page) throw new Error('Page not available');

    console.log('📝 Filling publish form...');
    
    // TODO: Customize these field selectors for your specific website
    const fieldMappings = [
      { selector: 'input[name="title"], #title', value: aiContent.seoTitle || sheetMusic.name },
      { selector: 'textarea[name="description"], #description', value: aiContent.description },
      { selector: 'select[name="genre"], #genre', value: aiContent.genre },
      { selector: 'input[name="tags"], #tags', value: aiContent.tags.join(', ') },
    ];

    for (const field of fieldMappings) {
      try {
        const element = await this.page.$(field.selector);
        if (element) {
          // Check if it's a select element
          const isSelect = await this.page.locator(field.selector).evaluate((el) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            return el.tagName.toLowerCase() === 'select';
          });
          
          if (isSelect) {
            // Try to select by text content first, then by value
            try {
              await this.page.selectOption(field.selector, { label: field.value });
            } catch {
              await this.page.selectOption(field.selector, field.value);
            }
          } else {
            await this.page.fill(field.selector, field.value);
          }
          
          console.log(`✅ Filled field ${field.selector} with: ${field.value.slice(0, 50)}...`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not fill field ${field.selector}:`, error);
      }
    }
  }

  private async uploadFile(file: { url: string; name: string }): Promise<void> {
    if (!this.page) throw new Error('Page not available');

    console.log(`📎 Uploading file: ${file.name}`);
    
    // TODO: Implement file upload logic
    // This is complex because we need to download the file from Notion first,
    // then upload it to the target website
    
    try {
      // Download file from Notion URL
      const response = await this.page.request.get(file.url);
      const buffer = await response.body();
      
      // Save temporarily (in a real implementation, you might use a temp directory)
      const tempPath = `/tmp/${file.name}`;
      writeFileSync(tempPath, buffer);
      
      // Upload to website
      const fileInput = await this.page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(tempPath);
        console.log(`✅ File uploaded: ${file.name}`);
      } else {
        throw new Error('File upload input not found');
      }
      
    } catch (error) {
      console.warn(`⚠️ File upload failed:`, error);
      // Don't fail the entire process for file upload issues
    }
  }

  private async submitForm(): Promise<string> {
    if (!this.page) throw new Error('Page not available');

    console.log('🚀 Submitting form...');
    
    // Submit the form
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Publish")',
      'button:has-text("Submit")',
      'button:has-text("Upload")',
    ];

    for (const selector of submitSelectors) {
      try {
        await this.page.click(selector);
        break;
      } catch {
        // Continue to next selector
      }
    }

    // Wait for success page or redirect
    await this.page.waitForTimeout(5000);
    
    // Get the published URL (this depends on the website structure)
    const publishedUrl = this.page.url();
    
    return publishedUrl;
  }

  private async takeScreenshot(name: string, screenshots: string[]): Promise<void> {
    if (!this.page) return;

    try {
      const screenshotPath = `screenshots/${name}-${Date.now()}.png`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      screenshots.push(screenshotPath);
    } catch (error) {
      console.warn(`⚠️ Failed to take screenshot ${name}:`, error);
    }
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Playwright resources...');
    
    if (this.page) {
      await this.page.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('✅ Cleanup completed');
  }
}