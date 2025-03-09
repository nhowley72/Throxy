import { z } from 'zod';
import { BaseAgent } from './base';

interface StudentPopulationResponse {
  population: number | null;
}

export class StudentPopulationAgent extends BaseAgent<number | null, StudentPopulationResponse> {
  protected prompt = `Find the total student population for the university. Based on your knowledge:
1. Determine the total number of enrolled students (undergraduate + graduate)
2. Use the most recent available data
3. Return the result as a JSON string with format: {"population": number}
4. If you're not confident about the number or can't find it, return {"population": null}

For reference:
- Large public universities in Latin America often have 50,000+ students
- Private universities typically have 10,000-30,000 students
- Include both undergraduate and graduate students
- Round to the nearest thousand if exact number is not known

University: {university.name}
Domain: {university.domain}`;

  protected outputSchema = z.object({
    population: z.number().nullable()
  });

  protected transformOutput(data: StudentPopulationResponse): number | null {
    return data.population;
  }

  protected formatPrompt(university: { name: string; domain: string }): string {
    return this.prompt
      .replace('{university.name}', university.name)
      .replace('{university.domain}', university.domain);
  }

  public async findStudentPopulation(university: { name: string; domain: string }): Promise<number | null> {
    const result = await this.runAgent(university);
    return result.success ? result.value : null;
  }
} 