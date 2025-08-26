#!/usr/bin/env node

import { appConfig } from "@/config/index.js";
import { AIService } from "@/services/ai.js";
import { NotionService } from "@/services/notion.js";
import { WebsiteManager } from "@/services/WebsiteManager.js";
import type { ProcessingResult } from "@/types/index.js";

async function main(): Promise<void> {
  const startTime = new Date();
  console.log(
    `🚀 Starting Sheet Music Publishing Bot at ${startTime.toISOString()}`
  );

  // Initialize services
  const notion = new NotionService();
  const ai = new AIService();
  const websiteManager = new WebsiteManager();
  // const youtube = new YouTubeService();

  try {
    console.log("📋 Configuration loaded successfully");
    console.log(`  - Notion Database: ${appConfig.notion.databaseId}`);
    console.log(`  - OpenAI Model: ${appConfig.openai.model}`);
    console.log(`  - Available Websites: ${websiteManager.getAvailableWebsites().join(", ") || "None"}`);
    console.log(`  - Playwright Headless: ${appConfig.playwright.headless}`);

    // Initialize website services
    if (websiteManager.getAvailableWebsites().length > 0) {
      await websiteManager.initialize();
    }

    // Core workflow implementation
    console.log("\n📥 Step 1: Fetching ready entries from Notion...");
    const readyEntries = await notion.getReadyEntries();

    if (readyEntries.length === 0) {
      console.log("ℹ️ No entries ready for publishing");
      return;
    }

    const results: ProcessingResult[] = [];

    // Process each entry
    for (const entry of readyEntries) {
      console.log(`\n🔄 Processing: "${entry.name}"`);
      console.log(`   📝 Author: ${entry.author || "N/A"}`);
      console.log(`   🎵 Type: ${entry.type || "N/A"}`);
      console.log(`   📊 Difficulty: ${entry.difficulty || "N/A"}`);
      console.log(`   🎼 Key: ${entry.key || "N/A"}`);
      console.log(`   🎹 MIDI Link: ${entry.midiLink?.substring(0, 50)}...`);
      console.log(`   📄 PDF Link: ${entry.pdfLink?.substring(0, 50)}...`);
      const processingStart = new Date();

      try {
        // Generate AI content
        console.log("🤖 Step 2: Generating AI content...");
        const aiContent = await ai.generateContent(entry.name, {
          author: entry.author,
          type: entry.type,
          difficulty: entry.difficulty,
          key: entry.key,
        });
        console.log(`   ✨ Generated description: ${aiContent.description}...`);
        console.log(`   🏷️  Generated genre: ${aiContent.genre}`);
        console.log(`   🏆 Generated tags: ${aiContent.tags.join(", ")}`);
        if (aiContent.seoTitle && aiContent.seoTitle !== entry.name) {
          console.log(`   🔍 SEO title: ${aiContent.seoTitle}`);
        }

        // Publish to websites
        let websiteResult;
        if (websiteManager.getAvailableWebsites().length > 0) {
          console.log("🌐 Step 3: Publishing to websites...");
          const publishResults = await websiteManager.publishToAllWebsites(entry, aiContent);
          
          console.log(`   📊 Publishing results: ${publishResults.successCount}/${publishResults.totalCount} successful`);
          
          // Use the first successful result for the main workflow
          const firstSuccess = publishResults.results.find(r => r.result.success);
          websiteResult = firstSuccess ? firstSuccess.result : {
            success: false,
            error: `Failed to publish to any website. Results: ${publishResults.results.map(r => `${r.website}: ${r.result.success ? 'Success' : r.result.error}`).join('; ')}`
          };
        } else {
          console.log("🌐 Step 3: No websites configured - skipping website publishing");
          websiteResult = { success: true };
        }

        let youtubeResult;
        // Skip YouTube integration for now
        // if (entry.videoLink && websiteResult.success && websiteResult.publishedUrl) {
        //   console.log("🎥 Step 4: Updating YouTube video...");
        //   const videoId = entry.videoLink.includes("v=")
        //     ? entry.videoLink.split("v=")[1]?.split("&")[0]
        //     : entry.videoLink;
        //   if (videoId) {
        //     youtubeResult = await youtube.updateVideoDescription(videoId, websiteResult.publishedUrl);
        //   }
        // }

        // Skip Notion updates for now
        console.log("📝 Step 5: Skipping Notion updates (testing mode)");
        // if (websiteResult.success) {
        //   await notion.updateEntry(entry.id, {
        //     status: "Published",
        //     publishedUrl: websiteResult.publishedUrl,
        //     genre: aiContent.genre,
        //     description: aiContent.description,
        //   });
        // }

        const result: ProcessingResult = {
          success: websiteResult.success,
          notionId: entry.id,
          title: entry.name,
          aiContent,
          websiteResult,
          youtubeResult,
          startTime: processingStart,
          endTime: new Date(),
        };

        results.push(result);

        if (result.success) {
          console.log(`✅ Successfully processed "${entry.name}"`);
        } else {
          console.log(
            `❌ Failed to process "${entry.name}": ${result.websiteResult?.error}`
          );
        }
      } catch (error) {
        const result: ProcessingResult = {
          success: false,
          notionId: entry.id,
          title: entry.name,
          error: error instanceof Error ? error.message : "Unknown error",
          startTime: processingStart,
          endTime: new Date(),
        };

        results.push(result);
        console.log(`❌ Failed to process "${entry.name}": ${result.error}`);
      }
    }

    // Summary
    const successful = results.filter((r) => r.success).length;
    const total = results.length;

    console.log("\n📊 Processing Summary:");
    console.log(`  - Total entries: ${total}`);
    console.log(`  - Successful: ${successful}`);
    console.log(`  - Failed: ${total - successful}`);

    if (successful > 0) {
      console.log("\n🎉 Successfully published sheet music!");
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    // Cleanup resources
    if (websiteManager.getAvailableWebsites().length > 0) {
      await websiteManager.cleanup();
    }
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
const pageIdIndex = args.indexOf("--page-id");
const specificPageId = pageIdIndex !== -1 ? args[pageIdIndex + 1] : undefined;

if (specificPageId) {
  console.log(`🎯 Processing specific page: ${specificPageId}`);
}

main().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});
