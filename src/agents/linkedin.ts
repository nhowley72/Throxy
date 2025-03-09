import { z } from 'zod';
import { BaseAgent } from './base';

interface LinkedInResponse {
  url: string | null;
}

export class LinkedInAgent extends BaseAgent<string | null, LinkedInResponse> {
  protected prompt = `Find the LinkedIn URL for the university. Based on your knowledge:
1. Determine if the university has an official LinkedIn profile
2. The URL should be in the format "https://www.linkedin.com/school/..."
3. Return the result as a JSON string with format: {"url": "linkedin_url_here"}
4. If you're not confident about the LinkedIn URL or can't find it, return {"url": null}

For reference:
- Official university LinkedIn profiles are usually verified
- They typically have thousands of followers
- The URL usually contains the university name in English or local language

University: {university.name}
Domain: {university.domain}`;

  protected outputSchema = z.object({
    url: z.string().nullable()
  });

  protected transformOutput(data: LinkedInResponse): string | null {
    return data.url;
  }

  protected formatPrompt(university: { name: string; domain: string }): string {
    return this.prompt
      .replace('{university.name}', university.name)
      .replace('{university.domain}', university.domain);
  }

  public async findLinkedInUrl(university: { name: string; domain: string }): Promise<string | null> {
    const result = await this.runAgent(university);
    return result.success ? result.value : null;
  }
} 