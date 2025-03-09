import { z } from 'zod';
import { BaseAgent } from './base';

interface LanguageCentreResponse {
  hasLanguageCentre: boolean | null;
}

export class LanguageCentreAgent extends BaseAgent<boolean | null, LanguageCentreResponse> {
  protected prompt = `Determine if the university has a language center/centre. Based on your knowledge:
1. Check if the university has a dedicated language learning facility
2. This could be called:
   - Language Center/Centre
   - Language School
   - Language Institute
   - Centro de Idiomas
   - Instituto de Lenguas
   - Escuela de Idiomas
3. Return the result as a JSON string with format: {"hasLanguageCentre": true/false}
4. If you're not confident about the existence of a language centre, return {"hasLanguageCentre": null}

For reference:
- Most large universities in Latin America have language centers
- They often offer courses in English and other foreign languages
- They may also offer Spanish/Portuguese courses for international students
- The center might be part of a larger faculty (e.g., Faculty of Languages)

University: {university.name}
Domain: {university.domain}`;

  protected outputSchema = z.object({
    hasLanguageCentre: z.boolean().nullable()
  });

  protected transformOutput(data: LanguageCentreResponse): boolean | null {
    return data.hasLanguageCentre;
  }

  protected formatPrompt(university: { name: string; domain: string }): string {
    return this.prompt
      .replace('{university.name}', university.name)
      .replace('{university.domain}', university.domain);
  }

  public async findLanguageCentre(university: { name: string; domain: string }): Promise<boolean | null> {
    const result = await this.runAgent(university);
    return result.success ? result.value : null;
  }
} 