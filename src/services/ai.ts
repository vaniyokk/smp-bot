import { appConfig } from "@/config/index.js";
import type { AIGeneratedContent } from "@/types/index.js";
import OpenAI from "openai";

export class AIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: appConfig.openai.apiKey,
    });
  }

  async generateContent(
    title: string,
    existingDescription?: string
  ): Promise<AIGeneratedContent> {
    console.log(`🤖 Generating AI content for: "${title}"`);

    try {
      const prompt = this.buildPrompt(title, existingDescription);

      const completion = await this.client.chat.completions.create({
        model: appConfig.openai.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert in classical and contemporary music, specializing in sheet music publishing and SEO optimization.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("Empty response from OpenAI");
      }

      const content = this.parseAIResponse(response);
      console.log(`✅ Generated AI content for "${title}"`);

      return content;
    } catch (error) {
      console.error(`❌ Failed to generate AI content for "${title}":`, error);
      throw new Error(
        `OpenAI API error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private buildPrompt(title: string, existingDescription?: string): string {
    return `
Analyze this sheet music title and generate optimized content for publishing:

Title: "${title}"
${existingDescription ? `Existing Description: "${existingDescription}"` : ""}

Please provide a JSON response with the following structure:
{
  "description": "An engaging, SEO-friendly description (100-200 words) that would appeal to musicians and music lovers. Include the style, difficulty level, and what makes this piece special.",
  "genre": "The most appropriate musical genre (choose from: Classical, Pop, Jazz, Folk, Rock, Electronic, Ambient, World, Soundtrack, Christmas, Wedding, Educational, or Other)",
  "tags": ["relevant", "searchable", "keywords", "for", "seo"],
  "seoTitle": "An optimized title for search engines (if different from original)"
}

Guidelines:
- Description should be engaging and informative
- Genre must be one of the listed options
- Include 5-8 relevant tags
- Focus on musical characteristics, difficulty, and appeal
- Consider search engine optimization
- Be accurate and helpful for potential buyers/downloaders
    `.trim();
  }

  private parseAIResponse(response: string): AIGeneratedContent {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        description: string;
        genre: string;
        tags: string[];
        seoTitle?: string;
      };

      // Validate the response structure
      if (!parsed.description || !parsed.genre || !Array.isArray(parsed.tags)) {
        throw new Error("Invalid AI response structure");
      }

      return {
        description: parsed.description.trim(),
        genre: this.validateGenre(parsed.genre),
        tags: parsed.tags.filter(
          (tag) => typeof tag === "string" && tag.trim().length > 0
        ),
        seoTitle: parsed.seoTitle?.trim(),
      };
    } catch {
      console.warn("⚠️ Failed to parse AI response, using fallback");

      // Fallback content generation
      return {
        description: `Beautiful sheet music for "${response.slice(
          0,
          100
        )}". Perfect for musicians of various skill levels.`,
        genre: "Other",
        tags: ["sheet music", "piano", "classical", "music"],
      };
    }
  }

  private validateGenre(genre: string): string {
    const validGenres = [
      "Classical",
      "Pop",
      "Jazz",
      "Folk",
      "Rock",
      "Electronic",
      "Ambient",
      "World",
      "Soundtrack",
      "Christmas",
      "Wedding",
      "Educational",
      "Other",
    ];

    const normalized = validGenres.find(
      (valid) => valid.toLowerCase() === genre.toLowerCase()
    );

    return normalized || "Other";
  }
}
