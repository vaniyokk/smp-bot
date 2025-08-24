#!/usr/bin/env node

import { appConfig } from '@/config/index.js';
import { NotionService } from '@/services/notion.js';
import { AIService } from '@/services/ai.js';
import { WebsiteService } from '@/services/website.js';
import { YouTubeService } from '@/services/youtube.js';
import type { ProcessingResult } from '@/types/index.js';

async function main(): Promise<void> {
  const startTime = new Date();
  console.log(`🚀 Starting Sheet Music Publishing Bot at ${startTime.toISOString()}`);

  // Initialize services
  const notion = new NotionService();
  const ai = new AIService();
  const website = new WebsiteService();
  const youtube = new YouTubeService();

  try {
    console.log('📋 Configuration loaded successfully');
    console.log(`  - Notion Database: ${appConfig.notion.databaseId}`);
    console.log(`  - OpenAI Model: ${appConfig.openai.model}`);
    console.log(`  - Website: ${appConfig.website.baseUrl}`);
    console.log(`  - Playwright Headless: ${appConfig.playwright.headless}`);

    // Initialize Playwright browser
    await website.initialize();

    // Core workflow implementation
    console.log('\n📥 Step 1: Fetching ready entries from Notion...');
    const readyEntries = await notion.getReadyEntries();
    
    if (readyEntries.length === 0) {
      console.log('ℹ️ No entries ready for publishing');
      return;
    }

    const results: ProcessingResult[] = [];

    // Process each entry
    for (const entry of readyEntries) {
      console.log(`\n🔄 Processing: "${entry.title}"`);
      const processingStart = new Date();
      
      try {
        // Generate AI content
        console.log('🤖 Step 2: Generating AI content...');
        const aiContent = await ai.generateContent(entry.title, entry.description);
        
        // Publish to website
        console.log('🌐 Step 3: Publishing to website...');
        const websiteResult = await website.publishSheetMusic(entry, aiContent);
        
        let youtubeResult;
        // Update YouTube if video ID exists and website publishing succeeded
        if (entry.youtubeVideoId && websiteResult.success && websiteResult.publishedUrl) {
          console.log('🎥 Step 4: Updating YouTube video...');
          youtubeResult = await youtube.updateVideoDescription(
            entry.youtubeVideoId, 
            websiteResult.publishedUrl
          );
        }

        // Update Notion with results
        console.log('📝 Step 5: Updating Notion...');
        if (websiteResult.success) {
          await notion.updateEntry(entry.id, {
            status: 'Published',
            publishedUrl: websiteResult.publishedUrl,
            genre: aiContent.genre,
            description: aiContent.description,
          });
        }

        const result: ProcessingResult = {
          success: websiteResult.success,
          notionId: entry.id,
          title: entry.title,
          aiContent,
          websiteResult,
          youtubeResult,
          startTime: processingStart,
          endTime: new Date(),
        };

        results.push(result);
        
        if (result.success) {
          console.log(`✅ Successfully processed "${entry.title}"`);
        } else {
          console.log(`❌ Failed to process "${entry.title}": ${result.websiteResult?.error}`);
        }

      } catch (error) {
        const result: ProcessingResult = {
          success: false,
          notionId: entry.id,
          title: entry.title,
          error: error instanceof Error ? error.message : 'Unknown error',
          startTime: processingStart,
          endTime: new Date(),
        };
        
        results.push(result);
        console.log(`❌ Failed to process "${entry.title}": ${result.error}`);
      }
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log('\n📊 Processing Summary:');
    console.log(`  - Total entries: ${total}`);
    console.log(`  - Successful: ${successful}`);
    console.log(`  - Failed: ${total - successful}`);
    
    if (successful > 0) {
      console.log('\n🎉 Successfully published sheet music!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Cleanup resources
    await website.cleanup();
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
const pageIdIndex = args.indexOf('--page-id');
const specificPageId = pageIdIndex !== -1 ? args[pageIdIndex + 1] : undefined;

if (specificPageId) {
  console.log(`🎯 Processing specific page: ${specificPageId}`);
}

main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});