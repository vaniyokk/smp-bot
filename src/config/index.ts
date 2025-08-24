import type { Config } from "@/types/index.js";
import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NOTION_TOKEN: z.string().min(1, "NOTION_TOKEN is required"),
  NOTION_DATABASE_ID: z.string().min(1, "NOTION_DATABASE_ID is required"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  YOUTUBE_CLIENT_ID: z.string().min(1, "YOUTUBE_CLIENT_ID is required"),
  YOUTUBE_CLIENT_SECRET: z.string().min(1, "YOUTUBE_CLIENT_SECRET is required"),
  YOUTUBE_REFRESH_TOKEN: z.string().min(1, "YOUTUBE_REFRESH_TOKEN is required"),
  WEBSITE_BASE_URL: z.string().url("WEBSITE_BASE_URL must be a valid URL"),
  WEBSITE_USERNAME: z.string().min(1, "WEBSITE_USERNAME is required"),
  WEBSITE_PASSWORD: z.string().min(1, "WEBSITE_PASSWORD is required"),
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
      youtube: {
        clientId: env.YOUTUBE_CLIENT_ID,
        clientSecret: env.YOUTUBE_CLIENT_SECRET,
        refreshToken: env.YOUTUBE_REFRESH_TOKEN,
      },
      website: {
        baseUrl: env.WEBSITE_BASE_URL,
        username: env.WEBSITE_USERNAME,
        password: env.WEBSITE_PASSWORD,
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
