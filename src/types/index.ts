export interface NotionSheetMusic {
  id: string;
  name: string; // "Name" field is the title
  author?: string | undefined;
  type?:
    | "Piano Solo"
    | "4 Hands Piano"
    | "Piano & Violin"
    | "Violin"
    | "Piano & Voice"
    | undefined;
  status: "No Publish" | "Ready" | "New" | "Published";
  difficulty?:
    | "Beginner"
    | "Simple"
    | "Medium"
    | "Hard"
    | "Extreme"
    | undefined;
  key?: string | undefined; // Musical key (C major, G major, etc.)
  videoLink?: string | undefined; // "Video Link" field
  pdfLink?: string | undefined; // "PDF Link" field
  midiLink?: string | undefined; // "MIDI Link" field
  notesMMS?: string | undefined; // "Notes MMS" field
  notesMusicnotes?: string | undefined; // "Notes Musicnotes" field
  notesArrangeMe?: string | undefined; // "Notes ArrangeMe" field
  reasoningMIDI?: string | undefined; // "Reasoning MIDI" field
  listings?: string[] | undefined; // "🛒 Listings" relation field
  publishedUrl?: string | undefined; // Published URL from website
  genre?: string | undefined; // Generated genre from AI
  description?: string | undefined; // Generated description from AI
  createdAt: string;
  updatedAt?: string | undefined;
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

export interface WebsiteConfig {
  name?: string | undefined;
  baseUrl?: string | undefined;
  username?: string | undefined;
  password?: string | undefined;
  enabled: boolean;
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
  youtube?: {
    clientId?: string | undefined;
    clientSecret?: string | undefined;
    refreshToken?: string | undefined;
  } | undefined;
  websites: {
    website1: WebsiteConfig;
    website2: WebsiteConfig;
    website3: WebsiteConfig;
  };
  playwright: {
    headless: boolean;
    timeout: number;
  };
}
