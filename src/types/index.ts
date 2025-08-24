export interface NotionSheetMusic {
  id: string;
  title: string;
  file?: {
    url: string;
    name: string;
  } | undefined;
  status: 'Draft' | 'Ready' | 'Published';
  youtubeVideoId?: string | undefined;
  publishedUrl?: string | undefined;
  genre?: string | undefined;
  description?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface AIGeneratedContent {
  description: string;
  genre: string;
  tags: string[];
  seoTitle?: string | undefined;
}

export interface WebsitePublishResult {
  success: boolean;
  publishedUrl?: string;
  error?: string;
  screenshots?: string[];
}

export interface YouTubeUpdateResult {
  success: boolean;
  videoId: string;
  updatedDescription?: string;
  error?: string;
}

export interface ProcessingResult {
  success: boolean;
  notionId: string;
  title: string;
  aiContent?: AIGeneratedContent | undefined;
  websiteResult?: WebsitePublishResult | undefined;
  youtubeResult?: YouTubeUpdateResult | undefined;
  error?: string | undefined;
  startTime: Date;
  endTime?: Date | undefined;
}

export interface Config {
  notion: {
    token: string;
    databaseId: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  youtube: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
  website: {
    baseUrl: string;
    username: string;
    password: string;
  };
  playwright: {
    headless: boolean;
    timeout: number;
  };
}