import { BaseWebsiteService } from "@/services/base/BaseWebsiteService.js";
import type {
  AIGeneratedContent,
  NotionSheetMusic,
  WebsitePublishResult,
} from "@/types/index.js";

/**
 * Website1Service - First website implementation
 * TODO: Replace with actual website name and customize for specific site
 */
export class Website1Service extends BaseWebsiteService {
  getWebsiteName(): string {
    return this.websiteConfig.name || "Website1";
  }

  async publishSheetMusic(
    sheetMusic: NotionSheetMusic,
    aiContent: AIGeneratedContent
  ): Promise<WebsitePublishResult> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    console.log(
      `🌐 Publishing "${sheetMusic.name}" to ${this.getWebsiteName()}...`
    );
    const screenshots: string[] = [];

    try {
      // Step 1: Navigate and login
      await this.login();
      await this.takeScreenshot("01-logged-in", screenshots);

      // Step 2: Navigate to publish form
      await this.navigateToPublishForm();
      await this.takeScreenshot("02-publish-form", screenshots);

      // Step 3: Fill form with sheet music data
      await this.fillPublishForm(sheetMusic, aiContent);
      await this.takeScreenshot("03-form-filled", screenshots);

      // Step 4: Upload file if available
      if (sheetMusic.pdfLink) {
        await this.uploadFile({
          url: sheetMusic.pdfLink,
          name: `${sheetMusic.name}.pdf`,
        });
        await this.takeScreenshot("04-file-uploaded", screenshots);
      }

      // Step 5: Submit and get published URL
      const publishedUrl = await this.submitForm();
      await this.takeScreenshot("05-published", screenshots);

      console.log(
        `✅ Successfully published "${
          sheetMusic.name
        }" to ${this.getWebsiteName()}: ${publishedUrl}`
      );

      return {
        success: true,
        publishedUrl,
        screenshots,
      };
    } catch (error) {
      await this.takeScreenshot("error-state", screenshots);

      console.error(
        `❌ Failed to publish "${
          sheetMusic.name
        }" to ${this.getWebsiteName()}:`,
        error
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        screenshots,
      };
    }
  }

  protected async login(): Promise<void> {
    if (!this.page) throw new Error("Page not available");

    console.log(`🔐 Logging into ${this.getWebsiteName()}...`);

    const config = this.getRequiredConfig();

    // Navigate to homepage
    await this.page.goto(config.baseUrl);

    // Wait for page to load and find the sign-in button in header
    console.log("  🔍 Looking for 'Sign-up · Sign-in' button...");
    const signInButton = await this.page.waitForSelector(
      'mp-button:has-text("Sign-up · Sign-in")',
      { timeout: 10000 }
    );

    if (!signInButton) {
      throw new Error("Could not find 'Sign-up · Sign-in' button in header");
    }

    // Click the sign-in button to open modal
    console.log("  👆 Clicking sign-in button to open modal...");
    await signInButton.click();

    // Wait for login modal to appear and find email field
    console.log("  📧 Waiting for login modal to appear...");
    const emailField = await this.page.waitForSelector('input[type="email"]', {
      timeout: 5000,
    });

    if (!emailField) {
      throw new Error("Could not find email field in login modal");
    }

    // Fill login form in modal
    console.log("  ✍️  Filling email field...");
    await this.page.fill('input[type="email"]', config.username);

    console.log("  🔒 Filling password field...");
    await this.page.fill('input[type="password"]', config.password);

    // Submit login by clicking Sign In button
    console.log("  🚀 Clicking Sign In button...");
    await this.page.click('button:has-text("Sign In")');

    // Wait for modal to close and login to complete
    console.log("  ⏳ Waiting for login to complete...");
    await this.page.waitForTimeout(5000);

    // Verify login was successful (modal should be gone)
    const modalStillVisible = await this.page.$('input[type="email"]');
    if (modalStillVisible) {
      throw new Error("Login may have failed - modal still visible");
    }

    console.log(`✅ Successfully logged into ${this.getWebsiteName()}`);
  }

  protected async navigateToPublishForm(): Promise<void> {
    if (!this.page) throw new Error("Page not available");

    console.log(`🧭 Navigating to publish form on ${this.getWebsiteName()}...`);

    // TODO: Customize navigation logic for specific website
    // Examples:
    // await this.page.click('a[href="/publish"], button:has-text("Add New"), #create-listing');
    // await this.waitForNavigation();
    await this.page.waitForTimeout(100); // Temporary await to fix linting

    console.log(`✅ Navigated to publish form on ${this.getWebsiteName()}`);
  }

  protected async fillPublishForm(
    sheetMusic: NotionSheetMusic,
    aiContent: AIGeneratedContent
  ): Promise<void> {
    if (!this.page) throw new Error("Page not available");

    console.log(`📝 Filling publish form on ${this.getWebsiteName()}...`);

    // TODO: Customize these field selectors for your specific website
    const fieldMappings = [
      {
        selector: 'input[name="title"], #title',
        value: aiContent.seoTitle || sheetMusic.name,
      },
      {
        selector: 'textarea[name="description"], #description',
        value: aiContent.description,
      },
      { selector: 'select[name="genre"], #genre', value: aiContent.genre },
      {
        selector: 'input[name="tags"], #tags',
        value: aiContent.tags.join(", "),
      },
      // Add more fields as needed for the specific website
    ];

    for (const field of fieldMappings) {
      try {
        await this.page.fill(field.selector, field.value);
        console.log(`  ✅ Filled: ${field.selector}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`  ⚠️ Could not fill ${field.selector}: ${errorMsg}`);
        // Continue with other fields
      }
    }

    console.log(`✅ Form filled on ${this.getWebsiteName()}`);
  }

  protected async uploadFile(file: {
    url: string;
    name: string;
  }): Promise<void> {
    if (!this.page) throw new Error("Page not available");

    console.log(`📎 Uploading file to ${this.getWebsiteName()}: ${file.name}`);

    try {
      // Download file from Notion URL
      const tempPath = await this.downloadFile(file.url, file.name);

      // Upload to website - TODO: Customize file upload selector
      const fileInput = await this.page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(tempPath);
        console.log(
          `✅ File uploaded to ${this.getWebsiteName()}: ${file.name}`
        );
      } else {
        throw new Error("Could not find file upload input");
      }
    } catch (error) {
      console.error(
        `❌ Failed to upload file to ${this.getWebsiteName()}:`,
        error
      );
      throw error;
    }
  }

  protected async submitForm(): Promise<string> {
    if (!this.page) throw new Error("Page not available");

    console.log(`🚀 Submitting form on ${this.getWebsiteName()}...`);

    // Submit the form - TODO: Customize submit button selector
    await this.page.click(
      'button[type="submit"], input[type="submit"], button:has-text("Publish")'
    );
    await this.waitForNavigation();

    // Extract published URL - TODO: Customize URL extraction logic
    const publishedUrl = this.page.url(); // Simple fallback - use current URL

    console.log(
      `✅ Form submitted on ${this.getWebsiteName()}, URL: ${publishedUrl}`
    );
    return publishedUrl;
  }
}
