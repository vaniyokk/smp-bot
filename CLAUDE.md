# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm run dev` - Run in development mode with hot reload
- `npm run build` - Build TypeScript to dist/
- `npm run type-check` - Run TypeScript compiler without emitting files
- `npm run lint` - Run ESLint on source files
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm start` - Run the built application
- `npm start -- --page-id <id>` - Process a specific Notion page by ID

### Testing
- `npm test` - Run tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI

### Other
- `npm run clean` - Remove dist/ directory
- `npm run prepare` - Set up husky hooks (runs automatically after npm install)

## Architecture Overview

This is a sheet music publishing automation bot that orchestrates a multi-step workflow across four external services. The architecture follows a service-oriented pattern with a central orchestrator.

### Core Workflow (src/index.ts)
The main orchestrator implements a linear 5-step process:
1. Fetch "Ready" entries from Notion database
2. Generate AI-enhanced content (descriptions, genres, tags)  
3. Publish to target website using browser automation
4. Update YouTube video descriptions with published links
5. Update Notion entries with results and published URLs

### Service Layer Architecture
Four independent services handle external API integrations:

**NotionService** (`src/services/notion.ts`):
- Uses `@notionhq/client` for database queries and property extraction
- Implements type-safe property parsing with extensive validation
- Handles status transitions (Draft → Ready → Published)

**AIService** (`src/services/ai.ts`):
- OpenAI integration for content generation
- JSON response parsing with fallback content
- Genre validation against predefined categories

**WebsiteService** (`src/services/website.ts`):
- Playwright browser automation with headless Chrome
- Generic form filling logic adaptable to different websites  
- Screenshot capture for debugging failures
- Temporary file handling for PDF uploads

**YouTubeService** (`src/services/youtube.ts`):
- YouTube Data API v3 with OAuth2 refresh tokens
- Batch processing with rate limiting
- Smart description updating (checks for existing links)

### Configuration Management
The `src/config/index.ts` uses Zod schemas for environment validation with:
- Type-safe configuration loading
- Automatic type coercion (strings to booleans/numbers)
- Descriptive error messages for missing/invalid environment variables

### Type System
Strong TypeScript interfaces in `src/types/index.ts` define the data flow:
- `NotionSheetMusic` - Notion database structure with optional fields
- `ProcessingResult` - Complete workflow execution results
- Service-specific result interfaces for error handling and logging

### Key Design Decisions

**Error Handling Strategy**: Each service returns result objects instead of throwing exceptions, allowing the orchestrator to collect partial results and continue processing other entries.

**Browser Automation Approach**: WebsiteService uses generic selectors and fallback logic to work with different website structures, making it adaptable without hardcoding specific site implementations.

**Configuration Validation**: All environment variables are validated at startup with detailed error messages, preventing runtime failures due to missing configuration.

**Pre-commit Quality Gates**: Husky + lint-staged with ESLint 9 and TypeScript strict mode prevents commits with type errors or linting violations.

## Development Notes

### Environment Setup
Copy `.env.example` to `.env` and configure all required API credentials. The application validates all environment variables at startup.

### GitHub Actions Integration
The workflow in `.github/workflows/publish.yml` supports:
- Manual triggering with optional page ID parameter
- Debug mode for screenshot collection
- Artifact collection for logs and debugging
- All secrets managed through GitHub repository settings

### Code Quality Enforcement
- ESLint 9 with typescript-eslint for type-aware linting
- Pre-commit hooks block commits with linting errors
- Strict TypeScript configuration with `exactOptionalPropertyTypes`
- Path aliases (`@/`) for clean imports

### Adding New Services
Follow the existing service pattern:
1. Create class with async methods returning result objects
2. Add comprehensive error handling with descriptive messages
3. Include detailed console logging for debugging
4. Add TypeScript interfaces for inputs/outputs
5. Integrate into main orchestrator workflow

## Key Takeaways from Development

### TypeScript & Linting Setup
- Use ESLint 9 with flat config format (`eslint.config.js`) over legacy `.eslintrc.json`
- Enable type-aware linting with `typescript-eslint` for catching runtime errors at lint time
- Modern setup: `typescript-eslint` package + `tseslint.config()` function
- Configure pre-commit hooks to prevent bad code from being committed

### Professional Project Structure
- Always update project documentation (like PRD.md) in real-time during implementation
- Use Zod for environment validation instead of manual checking
- Implement comprehensive error handling throughout the application
- Use path aliases (@/) for cleaner imports and better maintainability

### API Integration Best Practices
- Return result objects instead of throwing exceptions for better error handling
- Implement type-safe property extraction for external APIs (especially Notion)
- Use proper OAuth2 refresh token handling for long-running integrations
- Add rate limiting and retry logic for external API calls

### Browser Automation with Playwright
- Use generic selectors with fallback logic for website compatibility
- Implement screenshot capture for debugging failed automation
- Handle file uploads by downloading from source first, then uploading to target
- Use ESLint disable directives sparingly for DOM API access where type assertions aren't sufficient

### GitHub Actions Workflow Design  
- Manual workflow dispatch is ideal for POC and controlled deployment
- Include debug mode and artifact collection for troubleshooting
- Use GitHub repository secrets for all sensitive configuration
- Design workflows with clear success/failure indicators and logging