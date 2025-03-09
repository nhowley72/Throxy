import { z } from 'zod';
import { BaseAgent } from './base';

interface UniversityTypeResponse {
  type: 'public' | 'private' | null;
}

export class UniversityTypeAgent extends BaseAgent<'public' | 'private' | null, UniversityTypeResponse> {
  protected prompt = `Determine if the university is public or private. Based on your knowledge:
1. Determine the university's ownership/funding model
2. Public universities are primarily funded by government and have public oversight
3. Private universities are funded by private sources (tuition, endowments, etc.)
4. Return the result as a JSON string with format: {"type": "public"} or {"type": "private"}
5. If you're not confident about the type, return {"type": null}

For reference:
- Public universities in Latin America often have "Nacional" in their name
- Public universities typically have lower tuition fees
- Public universities are usually larger in student population
- Private universities often have religious affiliations (e.g., "Católica", "Pontificia")

University: {university.name}
Domain: {university.domain}`;

  protected outputSchema = z.object({
    type: z.enum(['public', 'private']).nullable()
  });

  protected transformOutput(data: UniversityTypeResponse): 'public' | 'private' | null {
    return data.type;
  }

  protected formatPrompt(university: { name: string; domain: string }): string {
    return this.prompt
      .replace('{university.name}', university.name)
      .replace('{university.domain}', university.domain);
  }

  public async findUniversityType(university: { name: string; domain: string }): Promise<'public' | 'private' | null> {
    const result = await this.runAgent(university);
    return result.success ? result.value : null;
  }
} 