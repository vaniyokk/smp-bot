import type { Config } from "@/types/index.js";
import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NOTION_TOKEN: z.string().min(1, "NOTION_TOKEN is required"),
  NOTION_DATABASE_ID: z.string().min(1, "NOTION_DATABASE_ID is required"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  
  // YouTube API Configuration (optional)
  YOUTUBE_CLIENT_ID: z.string().optional(),
  YOUTUBE_CLIENT_SECRET: z.string().optional(),
  YOUTUBE_REFRESH_TOKEN: z.string().optional(),
  
  // Website 1 Configuration (optional)
  WEBSITE1_NAME: z.string().optional(),
  WEBSITE1_BASE_URL: z.string().url().optional(),
  WEBSITE1_USERNAME: z.string().optional(),
  WEBSITE1_PASSWORD: z.string().optional(),
  WEBSITE1_ENABLED: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  
  // Website 2 Configuration (optional)
  WEBSITE2_NAME: z.string().optional(),
  WEBSITE2_BASE_URL: z.string().url().optional(),
  WEBSITE2_USERNAME: z.string().optional(),
  WEBSITE2_PASSWORD: z.string().optional(),
  WEBSITE2_ENABLED: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  
  // Website 3 Configuration (optional)
  WEBSITE3_NAME: z.string().optional(),
  WEBSITE3_BASE_URL: z.string().url().optional(),
  WEBSITE3_USERNAME: z.string().optional(),
  WEBSITE3_PASSWORD: z.string().optional(),
  WEBSITE3_ENABLED: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  
  // Playwright Configuration
  PLAYWRIGHT_HEADLESS: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  PLAYWRIGHT_TIMEOUT: z
    .string()
    .default("30000")
    .transform((val) => parseInt(val, 10)),
});

function getConfig(): Config {
  try {
    const env = envSchema.parse(process.env);

    return {
      notion: {
        token: env.NOTION_TOKEN,
        databaseId: env.NOTION_DATABASE_ID,
      },
      openai: {
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
      },
      youtube: env.YOUTUBE_CLIENT_ID ? {
        clientId: env.YOUTUBE_CLIENT_ID,
        clientSecret: env.YOUTUBE_CLIENT_SECRET,
        refreshToken: env.YOUTUBE_REFRESH_TOKEN,
      } : undefined,
      websites: {
        website1: {
          name: env.WEBSITE1_NAME,
          baseUrl: env.WEBSITE1_BASE_URL,
          username: env.WEBSITE1_USERNAME,
          password: env.WEBSITE1_PASSWORD,
          enabled: env.WEBSITE1_ENABLED,
        },
        website2: {
          name: env.WEBSITE2_NAME,
          baseUrl: env.WEBSITE2_BASE_URL,
          username: env.WEBSITE2_USERNAME,
          password: env.WEBSITE2_PASSWORD,
          enabled: env.WEBSITE2_ENABLED,
        },
        website3: {
          name: env.WEBSITE3_NAME,
          baseUrl: env.WEBSITE3_BASE_URL,
          username: env.WEBSITE3_USERNAME,
          password: env.WEBSITE3_PASSWORD,
          enabled: env.WEBSITE3_ENABLED,
        },
      },
      playwright: {
        headless: env.PLAYWRIGHT_HEADLESS,
        timeout: env.PLAYWRIGHT_TIMEOUT,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment validation failed:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const appConfig = getConfig();
