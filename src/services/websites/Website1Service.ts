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

      // Step 4: Upload suppressed for testing
      console.log("📎 Step 4: Upload suppressed for testing");

      // Step 5: Submit suppressed for testing
      console.log("🚀 Step 5: Submit suppressed for testing");

      console.log(
        `✅ Form filling completed for "${
          sheetMusic.name
        }" on ${this.getWebsiteName()} (upload/submit suppressed)`
      );

      return {
        success: true,
        publishedUrl: "http://test-form-filling-only.example.com",
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
    const modalStillVisible = await this.page.locator('input[type="email"]').count() > 0;
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
    const notificationModal = await this.page.locator("artist-notice-modal").count() > 0;
    if (notificationModal) {
      console.log(
        "  ⚠️  Notification modal detected, attempting to close properly..."
      );

      // Find the main content area that needs to be scrolled
      const mainContentLocator = this.page.locator("artist-notice-modal main");
      const hasMainContent = await mainContentLocator.count() > 0;
      if (hasMainContent) {
        console.log(
          "  📜 Scrolling down in modal content to enable Confirm button..."
        );

        // Scroll to the bottom of the main content
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await mainContentLocator.evaluate((element: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          element.scrollTop = element.scrollHeight;
        });

        // Wait for the scroll to complete and button to be enabled
        await this.page.waitForTimeout(2000);

        // Now try to click the Confirm button
        const confirmButtonLocator = this.page.locator(
          'artist-notice-modal mp-button:has-text("Confirm")'
        );
        const hasConfirmButton = await confirmButtonLocator.count() > 0;
        if (hasConfirmButton) {
          console.log("  ✅ Clicking Confirm button...");
          await confirmButtonLocator.click();

          // Wait for modal to close
          await this.page.waitForTimeout(2000);

          // Check if modal is gone
          const modalGone = await this.page.locator("artist-notice-modal").count() === 0;
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
      const anyModal = await this.page.locator(
        'modal-container.show, .modal.show, [role="dialog"]'
      ).count() > 0;
      const anyForm = await this.page.locator(
        'form, .upload-form, input[type="file"]'
      ).count() > 0;

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
    _aiContent: AIGeneratedContent
  ): Promise<void> {
    if (!this.page) throw new Error("Page not available");

    console.log(`📝 Filling publish form on ${this.getWebsiteName()}...`);

    try {
      // Step 1: Select Piano instrument - wait for visual confirmation
      console.log("  🎹 Step 1: Selecting Piano instrument...");
      await this.selectPianoInstrument();

      // Step 2: Fill Difficulty dropdown
      console.log("  📊 Step 2: Selecting difficulty...");
      await this.fillDropdown(
        "level",
        this.mapDifficulty(sheetMusic.difficulty)
      );

      // Step 3: Fill Instrumentation dropdown
      console.log("  🎼 Step 3: Selecting instrumentation...");
      await this.fillInstrumentationDropdown(
        this.mapInstrumentation(sheetMusic.type)
      );

      // Step 4: Fill Type dropdown (always "2 Staves")
      console.log("  📋 Step 4: Selecting type...");
      await this.fillDropdown("sheetType", "2 Staves");

      // Step 5: Fill Lyric dropdown (always "Not Included")
      console.log("  🎤 Step 5: Selecting lyric...");
      await this.fillDropdown("includeLyrics", "Not Included");

      // Step 6: Fill Chord dropdown (always "Not Included")
      console.log("  🎵 Step 6: Selecting chord...");
      await this.fillDropdown("includeChord", "Not Included");

      console.log(`✅ First tab form filled on ${this.getWebsiteName()}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to fill form: ${errorMsg}`);
      throw error;
    }
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
      const fileInputLocator = this.page.locator('input[type="file"]');
      const hasFileInput = await fileInputLocator.count() > 0;
      if (hasFileInput) {
        await fileInputLocator.setInputFiles(tempPath);
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

  /**
   * Helper method to fill instrumentation dropdown using native Playwright selectOption
   */
  private async fillInstrumentationDropdown(value: string): Promise<void> {
    if (!this.page) throw new Error("Page not available");

    console.log(`    🔍 Looking for instrumentation dropdown...`);

    // Try to find a native HTML select element first using locator
    const selectLocator = this.page.locator(
      '[formcontrolname="instrumentation"] select'
    );
    const selectCount = await selectLocator.count();

    if (selectCount > 0) {
      console.log(`    ✅ Found native select element for instrumentation`);
      console.log(`    📋 Using Playwright's selectOption: "${value}"`);

      try {
        await selectLocator.selectOption({ label: value });
        console.log(
          `    ✅ Successfully selected "${value}" using selectOption`
        );
        return;
      } catch {
        console.log(`    ⚠️ selectOption failed, trying by value...`);
        try {
          await selectLocator.selectOption(value);
          console.log(
            `    ✅ Successfully selected "${value}" using selectOption by value`
          );
          return;
        } catch {
          console.log(
            `    ⚠️ Native selectOption failed, falling back to custom approach`
          );
        }
      }
    }

    // Fallback to custom dropdown approach for Angular Material
    console.log(`    🔍 Looking for Angular Material dropdown...`);
    const dropdownLocator = this.page.locator(
      '[formcontrolname="instrumentation"] mp-select'
    );
    const dropdownCount = await dropdownLocator.count();
    if (dropdownCount === 0) {
      throw new Error("Could not find instrumentation dropdown");
    }

    console.log(`    ✅ Found Angular Material dropdown`);
    console.log(`    📋 Using selectOption on the page for "${value}"`);

    // Try Playwright's page-level selectOption which works with custom dropdowns
    try {
      await this.page.selectOption('[formcontrolname="instrumentation"]', {
        label: value,
      });
      console.log(`    ✅ Page selectOption succeeded: "${value}"`);
    } catch {
      console.log(`    ⚠️ Page selectOption failed, trying click approach...`);

      // Fallback to click approach with better reliability
      console.log(`    👆 Opening dropdown by clicking...`);
      await dropdownLocator.click();
      await this.page.waitForTimeout(500);

      console.log(`    🎯 Looking for option: "${value}"`);

      // Use optimized CDK overlay selector based on test results - first selector always works
      const cdkOverlaySelectors = [
        `.cdk-overlay-pane mp-menu-cell:has-text("${value}")`,
      ];

      let optionLocator = null;
      for (const selector of cdkOverlaySelectors) {
        try {
          const locator = this.page.locator(selector);
          const count = await locator.count();
          if (count > 0) {
            optionLocator = locator.first();
            console.log(
              `    ✅ Found option with CDK overlay selector: ${selector}`
            );
            break;
          }
        } catch {
          console.log(`    ⚠️ Selector failed: ${selector}`);
        }
      }

      if (!optionLocator) {
        // Wait a bit more and try one more time in case overlay is still loading
        await this.page.waitForTimeout(1000);
        for (const selector of cdkOverlaySelectors) {
          try {
            const locator = this.page.locator(selector);
            const count = await locator.count();
            if (count > 0) {
              optionLocator = locator.first();
              console.log(
                `    ✅ Found option after retry with selector: ${selector}`
              );
              break;
            }
          } catch {
            continue;
          }
        }

        if (!optionLocator) {
          throw new Error(
            `Could not find instrumentation option: ${value} - tried CDK overlay selectors`
          );
        }
      }

      console.log(
        `    ✅ Found option "${value}", trying multiple click approaches...`
      );

      // Try multiple approaches since regular click might fail due to visibility detection
      const clickMethods = [
        {
          name: "Force click (bypass visibility checks)",
          action: async (): Promise<void> =>
            await optionLocator.click({ force: true }),
        },
        {
          name: "Coordinate-based click",
          action: async (): Promise<void> => {
            const box = await optionLocator.boundingBox();
            if (box) {
              await this.page!.mouse.click(
                box.x + box.width / 2,
                box.y + box.height / 2
              );
            } else {
              throw new Error("No bounding box");
            }
          },
        },
        {
          name: "JavaScript evaluate click",
          action: async (): Promise<void> => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await optionLocator.evaluate((el: any) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              el.click();
            });
          },
        },
      ];

      let success = false;
      for (const method of clickMethods) {
        try {
          console.log(`    🎯 Trying ${method.name}...`);
          await method.action();
          success = true;
          console.log(`    ✅ ${method.name} succeeded: "${value}"`);
          break;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          console.log(`    ⚠️ ${method.name} failed: ${errorMsg}`);
          continue;
        }
      }

      if (!success) {
        throw new Error(
          `All click methods failed for instrumentation option: ${value}`
        );
      }
    }
  }

  private async fillDropdown(
    formControlName: string,
    value: string
  ): Promise<void> {
    if (!this.page) throw new Error("Page not available");

    try {
      console.log(`    🔍 Looking for dropdown: ${formControlName}`);

      // Step 1: Find and click the dropdown to open it
      let dropdownLocator = this.page.locator(
        `mp-select[formcontrolname="${formControlName}"]`
      );
      let hasDropdown = await dropdownLocator.count() > 0;

      // If not found directly, try looking inside custom components
      if (!hasDropdown) {
        console.log(
          `    🔍 Trying alternative selectors for ${formControlName}...`
        );

        // Use optimized custom selector based on test results - first selector always works
        const customSelectors = [
          `[formcontrolname="${formControlName}"] mp-select`,
        ];

        for (const selector of customSelectors) {
          dropdownLocator = this.page.locator(selector);
          hasDropdown = await dropdownLocator.count() > 0;
          if (hasDropdown) {
            console.log(`    ✅ Found dropdown with selector: ${selector}`);
            break;
          }
        }
      }

      if (!hasDropdown) {
        // Debug: list all mp-select elements
        const allDropdownsCount = await this.page.locator("mp-select").count();
        console.log(
          `    🔍 Found ${allDropdownsCount} mp-select elements total`
        );

        throw new Error(
          `Could not find dropdown with formcontrolname="${formControlName}"`
        );
      }

      // Take screenshot before opening dropdown (if instrumentation)
      if (formControlName === "instrumentation") {
        await this.takeScreenshot(
          `before-${formControlName}-click-${Date.now()}`,
          []
        );
      }

      // Step 2: Click the dropdown to open the menu
      console.log(`    👆 Opening dropdown for ${formControlName}...`);
      try {
        await dropdownLocator.click();
      } catch {
        console.log(
          `    ⚠️ Normal dropdown click failed, trying force click...`
        );
        await dropdownLocator.click({ force: true });
      }

      // Take screenshot after opening dropdown (if instrumentation)
      if (formControlName === "instrumentation") {
        await this.page.waitForTimeout(500); // Wait for dropdown animation
        await this.takeScreenshot(
          `after-${formControlName}-opened-${Date.now()}`,
          []
        );
      }

      // Step 3: Playwright automatically waits for dropdown options to appear
      console.log(`    ⏳ Waiting for dropdown options to appear...`);

      // Step 4: Find and click the option immediately
      console.log(`    🎯 Looking for option: "${value}"`);

      // Playwright handles timing automatically

      // Find the option - handle CDK overlay dropdowns
      let selectedOption = null;

      // Use optimized selector based on test results - use .first() to handle multiple matches
      const selectors = [`mp-menu-cell:has-text("${value}")`];

      for (const selector of selectors) {
        try {
          const optionLocator = this.page.locator(selector).first();
          const hasOption = await this.page.locator(selector).count() > 0;
          if (hasOption) {
            selectedOption = optionLocator;
            console.log(`    ✅ Found option with selector: ${selector}`);

            // Try clicking different parts of the menu cell
            console.log(`    👆 Clicking option immediately: "${value}"`);

            // Since $0.click() works in DevTools, use JavaScript execution
            console.log(
              `    🎯 Using JavaScript click (like DevTools $0.click())...`
            );

            // Try multiple click strategies that work for all dropdowns
            const clickMethods = [
              {
                name: "JavaScript click",
                action: async (): Promise<void> => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                  await selectedOption!.evaluate((element: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    element.click();
                  });
                },
              },
              {
                name: "Force click",
                action: async (): Promise<void> => {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                  await selectedOption!.click({ force: true, timeout: 1000 });
                },
              },
              {
                name: "Text element click",
                action: async (): Promise<void> => {
                  const textElLocator = this.page!.locator(`text="${value}"`).first();
                  const hasTextEl = await this.page!.locator(`text="${value}"`).count() > 0;
                  const textEl = hasTextEl ? textElLocator : null;
                  if (textEl) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await textEl.evaluate((el: any) => {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                      el.click();
                    });
                  } else {
                    throw new Error("Text element not found");
                  }
                },
              },
            ];

            for (const method of clickMethods) {
              try {
                console.log(`    🎯 Trying ${method.name}...`);
                await method.action();
                console.log(`    ✅ ${method.name} succeeded: "${value}"`);

                // Take screenshot after clicking option (if instrumentation)
                if (formControlName === "instrumentation") {
                  await this.page.waitForTimeout(300);
                  await this.takeScreenshot(
                    `after-${formControlName}-selected-${Date.now()}`,
                    []
                  );
                }

                // Trigger focus/blur on the dropdown to ensure Angular form validation recognizes the change
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await dropdownLocator.evaluate((el: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    el.focus();
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    el.blur();
                  });
                  console.log(
                    `    🔄 Triggered focus/blur to update form validation`
                  );
                } catch {
                  console.log(
                    `    ⚠️ Could not trigger focus/blur, but continuing...`
                  );
                }

                // Take final screenshot after focus/blur (if instrumentation)
                if (formControlName === "instrumentation") {
                  await this.page.waitForTimeout(500);
                  await this.takeScreenshot(
                    `final-${formControlName}-validation-${Date.now()}`,
                    []
                  );
                }

                // Wait for dropdown to close and return
                await this.page.waitForTimeout(1000);
                return;
              } catch (clickError) {
                const errorMsg =
                  clickError instanceof Error
                    ? clickError.message
                    : String(clickError);
                console.log(`    ⚠️ ${method.name} failed: ${errorMsg}`);
                continue;
              }
            }

            // All click methods failed
            console.log(`    ❌ All click methods failed for: "${value}"`);
            break;
          }
        } catch {
          console.log(`    ⚠️ Selector failed: ${selector}`);
          continue;
        }
      }

      // If we reach here, no option was found with any selector
      throw new Error(
        `Could not find option "${value}" for ${formControlName} using any selector`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(
        `    ❌ Failed to fill dropdown ${formControlName}: ${errorMsg}`
      );
      throw error;
    }
  }

  /**
   * Map Notion difficulty values to website dropdown options
   */
  private mapDifficulty(difficulty?: string): string {
    if (!difficulty) return "Normal";

    const difficultyMap: { [key: string]: string } = {
      Easy: "Easy",
      Medium: "Normal",
      Hard: "Hard",
      Expert: "Expert",
      Beginner: "Beginner",
    };

    return difficultyMap[difficulty] || "Normal";
  }

  /**
   * Map Notion type values to website instrumentation options
   */
  private mapInstrumentation(type?: string): string {
    if (!type) return "Solo";

    const instrumentationMap: { [key: string]: string } = {
      "Piano Solo": "Solo",
      "Piano Ensemble": "Ensemble",
      "Piano Duet": "Four Hands",
      Orchestra: "Orchestra",
      Band: "Band",
    };

    return instrumentationMap[type] || "Solo";
  }

  /**
   * Select Piano instrument with validation verification like a real user would
   */
  private async selectPianoInstrument(): Promise<void> {
    if (!this.page) throw new Error("Page not available");

    console.log("    🎯 Looking for Piano instrument button...");

    // Wait for instrument selector to be visible
    await this.page.waitForSelector("km-instrument-selector", {
      timeout: 10000,
    });

    // Check if Piano is already selected (has dark background and close icon)
    console.log("    🔍 Checking if Piano is already selected...");
    const selectedPianoSelector =
      '.instruments.active mp-button.right-icon:has(span.label):has-text("Piano"):has(mp-icon[style*="close"])';
    const isAlreadySelected = await this.page.locator(selectedPianoSelector).count() > 0;

    if (isAlreadySelected) {
      console.log(
        "    ✅ Piano is already selected (has dark background and close icon)"
      );
      return;
    }

    // Find the unselected Piano button to click
    console.log(
      "    🎯 Piano not selected, looking for Piano button to click..."
    );
    const pianoSelector =
      '.instruments.active mp-button:has(span.label):has-text("Piano"):not(:has-text("Piano 61keys"))';
    const pianoButtonLocator = this.page.locator(pianoSelector);
    const hasPianoButton = await pianoButtonLocator.count() > 0;

    if (!hasPianoButton) {
      throw new Error(
        "Could not find Piano instrument button in active instruments section"
      );
    }

    console.log("    ✅ Found unselected Piano button");
    console.log("    👆 Clicking Piano button to select it...");

    // Try different click approaches
    const clickMethods = [
      {
        name: "Standard click",
        action: async (): Promise<void> => {
          await pianoButtonLocator.scrollIntoViewIfNeeded();
          await this.page!.waitForTimeout(500);
          await pianoButtonLocator.click();
        },
      },
      {
        name: "Force click",
        action: async (): Promise<void> => {
          await pianoButtonLocator.click({ force: true });
        },
      },
      {
        name: "JavaScript click",
        action: async (): Promise<void> => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await pianoButtonLocator.evaluate((el: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            el.click();
          });
        },
      },
    ];

    let clickSucceeded = false;
    for (const method of clickMethods) {
      try {
        console.log(`    🎯 Trying ${method.name}...`);
        await method.action();

        // Wait for state change and verify Piano is now selected
        await this.page.waitForTimeout(1000);
        const nowSelected = await this.page.locator(selectedPianoSelector).count() > 0;

        if (nowSelected) {
          console.log(
            `    ✅ ${method.name} succeeded - Piano is now selected (verified by dark background and close icon)`
          );
          clickSucceeded = true;
          break;
        } else {
          console.log(
            `    ⚠️ ${method.name} clicked but Piano not selected (no visual state change)`
          );
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`    ❌ ${method.name} failed: ${errorMsg}`);
        continue;
      }
    }

    if (!clickSucceeded) {
      throw new Error(
        "Failed to select Piano instrument - all click methods failed or didn't change state"
      );
    }
  }
}
