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
      timeout: 10000,
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

    // Step 1: Navigate to artist center dashboard
    console.log("  🎯 Step 1: Navigating to /artist-center/dashboard...");
    const config = this.getRequiredConfig();
    const dashboardUrl = new URL(
      "/artist-center/dashboard",
      config.baseUrl
    ).toString();
    await this.page.goto(dashboardUrl);
    await this.page.waitForLoadState("networkidle");

    // Handle the notification modal that appears
    console.log("  📋 Checking for notification modal...");
    await this.page.waitForTimeout(2000);

    // Look for the notification modal (can have any text, not just "Fill out your")
    const notificationModal = await this.page.$("artist-notice-modal");
    if (notificationModal) {
      console.log(
        "  ⚠️  Notification modal detected, attempting to close properly..."
      );

      // Find the main content area that needs to be scrolled
      const mainContent = await this.page.$("artist-notice-modal main");
      if (mainContent) {
        console.log(
          "  📜 Scrolling down in modal content to enable Confirm button..."
        );

        // Scroll to the bottom of the main content
        await mainContent.evaluate((element) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          (element as any).scrollTop = (element as any).scrollHeight;
        });

        // Wait for the scroll to complete and button to be enabled
        await this.page.waitForTimeout(2000);

        // Now try to click the Confirm button
        const confirmButton = await this.page.$(
          'artist-notice-modal mp-button:has-text("Confirm")'
        );
        if (confirmButton) {
          console.log("  ✅ Clicking Confirm button...");
          await confirmButton.click();

          // Wait for modal to close
          await this.page.waitForTimeout(2000);

          // Check if modal is gone
          const modalGone = !(await this.page.$("artist-notice-modal"));
          if (modalGone) {
            console.log("  🎯 Notification modal closed successfully!");
          } else {
            console.log("  ⚠️  Modal still present after Confirm click");
          }
        } else {
          console.log("  ⚠️  Could not find Confirm button after scrolling");
        }
      } else {
        console.log("  ⚠️  Could not find main content to scroll");
      }
    } else {
      console.log("  ✅ No notification modal detected");
    }

    // Step 2: Click Upload button
    console.log("  📤 Step 2: Looking for Upload button...");
    const uploadButton = await this.page.waitForSelector(
      'mp-button:has-text("Upload")',
      { timeout: 10000 }
    );

    if (!uploadButton) {
      throw new Error("Could not find Upload button in dashboard");
    }

    console.log("  👆 Clicking Upload button...");
    try {
      await uploadButton.click();
    } catch {
      console.log("  ⚠️  Upload button click failed, trying force click...");
      await uploadButton.click({ force: true });
    }

    // Step 3: Click Sheet Music item in modal
    console.log("  🎵 Step 3: Looking for Sheet Music option in modal...");

    // Wait for upload modal to appear first
    await this.page.waitForTimeout(2000);

    // Use the working selector (most likely post-type-item[type="musicSheet"])
    console.log("  🔍 Looking for Sheet Music option...");
    const sheetMusicOption = await this.page.waitForSelector(
      'post-type-item[type="musicSheet"]',
      { timeout: 10000 }
    );

    if (!sheetMusicOption) {
      throw new Error("Could not find Sheet Music option");
    }

    console.log("  👆 Clicking Sheet Music option...");
    try {
      // Scroll element into view first
      await sheetMusicOption.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(1000);
      await sheetMusicOption.click();
      console.log("  ✅ Sheet Music option clicked successfully");
    } catch {
      console.log(`  ⚠️  Normal click failed, trying force click...`);
      try {
        await sheetMusicOption.click({ force: true });
        console.log("  ✅ Force click succeeded");
      } catch (forceError) {
        const errorMsg =
          forceError instanceof Error ? forceError.message : String(forceError);
        console.log(`  ❌ Force click also failed: ${errorMsg}`);
        throw new Error(`Failed to click Sheet Music option: ${errorMsg}`);
      }
    }

    // Step 4: Wait for Sheet Upload modal using specific HTML structure
    console.log("  📋 Step 4: Waiting for Sheet Upload modal to appear...");

    try {
      // Use specific selectors based on actual modal HTML structure:
      // <modal-container class="modal show">
      //   <div class="modal-dialog sheet-write-modal">
      //     <sheet-write-modal>
      const sheetUploadModal = await this.page.waitForSelector(
        "sheet-write-modal, .sheet-write-modal, modal-container.show:has(sheet-write-modal)",
        { timeout: 15000 }
      );

      if (sheetUploadModal) {
        console.log("  🎯 Sheet Upload modal detected!");
      }
    } catch {
      console.log(
        "  ⚠️  Specific modal not found, checking for any form/modal changes..."
      );

      // Fallback: Check if any new modal or form appeared
      const anyModal = await this.page.$(
        'modal-container.show, .modal.show, [role="dialog"]'
      );
      const anyForm = await this.page.$(
        'form, .upload-form, input[type="file"]'
      );

      if (anyModal || anyForm) {
        console.log("  🎯 Some modal or form detected, continuing...");
      } else {
        console.log(
          "  ⚠️  No modal changes detected, but continuing anyway..."
        );
      }
    }

    // Wait a bit more for any form to fully load
    await this.page.waitForTimeout(3000);

    console.log(
      `✅ Successfully navigated to publish form on ${this.getWebsiteName()}`
    );
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
