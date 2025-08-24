import { Client } from '@notionhq/client';
import type { 
  PageObjectResponse, 
  DatabaseObjectResponse,
  PartialPageObjectResponse,
  PartialDatabaseObjectResponse 
} from '@notionhq/client/build/src/api-endpoints.js';
import type { NotionSheetMusic } from '@/types/index.js';
import { appConfig } from '@/config/index.js';

export class NotionService {
  private client: Client;

  constructor() {
    this.client = new Client({ auth: appConfig.notion.token });
  }

  async getReadyEntries(): Promise<NotionSheetMusic[]> {
    console.log('📋 Fetching ready entries from Notion...');
    
    try {
      const response = await this.client.databases.query({
        database_id: appConfig.notion.databaseId,
        filter: {
          property: 'Status',
          select: {
            equals: 'Ready'
          }
        },
        sorts: [
          {
            property: 'Created',
            direction: 'ascending'
          }
        ]
      });

      const entries: NotionSheetMusic[] = response.results.map(page => {
        if (!this.isFullPage(page)) {
          throw new Error('Invalid page structure');
        }

        const props = page.properties;
        
        return {
          id: page.id,
          title: this.extractTitle(props.Title),
          file: this.extractFile(props.File),
          status: this.extractStatus(props.Status),
          youtubeVideoId: this.extractText(props['YouTube Video ID']),
          publishedUrl: this.extractUrl(props['Published URL']),
          genre: this.extractSelect(props.Genre),
          description: this.extractText(props.Description),
          createdAt: page.created_time,
          updatedAt: page.last_edited_time,
        };
      });

      console.log(`✅ Found ${entries.length} ready entries`);
      return entries;
      
    } catch (error) {
      console.error('❌ Failed to fetch Notion entries:', error);
      throw new Error(`Notion API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private isFullPage(page: PageObjectResponse | PartialPageObjectResponse | PartialDatabaseObjectResponse | DatabaseObjectResponse): page is PageObjectResponse {
    return 'properties' in page && 'created_time' in page && 'last_edited_time' in page;
  }

  async updateEntry(id: string, updates: Partial<NotionSheetMusic>): Promise<void> {
    console.log(`📝 Updating Notion entry ${id}...`);
    
    try {
      const properties: Record<string, unknown> = {};
      
      if (updates.status) {
        properties.Status = { select: { name: updates.status } };
      }
      
      if (updates.publishedUrl) {
        properties['Published URL'] = { url: updates.publishedUrl };
      }
      
      if (updates.genre) {
        properties.Genre = { select: { name: updates.genre } };
      }
      
      if (updates.description) {
        properties.Description = { rich_text: [{ text: { content: updates.description } }] };
      }

      await this.client.pages.update({
        page_id: id,
        properties
      });

      console.log(`✅ Updated Notion entry ${id}`);
      
    } catch (error) {
      console.error(`❌ Failed to update Notion entry ${id}:`, error);
      throw new Error(`Notion update error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractTitle(prop: unknown): string {
    if (prop && typeof prop === 'object' && 'title' in prop && Array.isArray(prop.title)) {
      return prop.title.map((t: unknown) => 
        t && typeof t === 'object' && 'plain_text' in t ? t.plain_text : ''
      ).join('');
    }
    return '';
  }

  private extractFile(prop: unknown): { url: string; name: string } | undefined {
    if (
      prop && 
      typeof prop === 'object' && 
      'files' in prop && 
      Array.isArray(prop.files) && 
      prop.files.length > 0
    ) {
      const file = prop.files[0] as Record<string, unknown>;
      if (
        file && 
        typeof file === 'object' && 
        'file' in file && 
        file.file && 
        typeof file.file === 'object' && 
        'url' in file.file
      ) {
        const fileObj = file.file as Record<string, unknown>;
        const url = fileObj.url;
        
        if (typeof url === 'string') {
          const fileName = 'name' in file && typeof file.name === 'string' 
            ? file.name 
            : 'file.pdf';
          
          return {
            url,
            name: fileName
          };
        }
      }
    }
    return undefined;
  }

  private extractStatus(prop: unknown): 'Draft' | 'Ready' | 'Published' {
    if (prop && typeof prop === 'object' && 'select' in prop && prop.select &&
        typeof prop.select === 'object' && 'name' in prop.select) {
      const name = String(prop.select.name);
      if (name === 'Draft' || name === 'Ready' || name === 'Published') {
        return name;
      }
    }
    return 'Draft';
  }

  private extractText(prop: unknown): string | undefined {
    if (prop && typeof prop === 'object' && 'rich_text' in prop && Array.isArray(prop.rich_text)) {
      return prop.rich_text.map((t: unknown) => 
        t && typeof t === 'object' && 'plain_text' in t ? t.plain_text : ''
      ).join('') || undefined;
    }
    return undefined;
  }

  private extractUrl(prop: unknown): string | undefined {
    if (prop && typeof prop === 'object' && 'url' in prop && typeof prop.url === 'string') {
      return prop.url;
    }
    return undefined;
  }

  private extractSelect(prop: unknown): string | undefined {
    if (prop && typeof prop === 'object' && 'select' in prop && prop.select &&
        typeof prop.select === 'object' && 'name' in prop.select) {
      return String(prop.select.name);
    }
    return undefined;
  }
}