import pLimit from 'p-limit';
import { ThroxyAPI } from './api';
import { LinkedInAgent } from './agents/linkedin';
import { StudentPopulationAgent } from './agents/student-population';
import { UniversityTypeAgent } from './agents/university-type';
import { LanguageCentreAgent } from './agents/language-centre';
import { University } from './types';

export class UniversityEnricher {
  private linkedInAgent = new LinkedInAgent();
  private studentPopulationAgent = new StudentPopulationAgent();
  private universityTypeAgent = new UniversityTypeAgent();
  private languageCentreAgent = new LanguageCentreAgent();
  private concurrencyLimit: number;

  constructor(concurrencyLimit = 5) {
    this.concurrencyLimit = concurrencyLimit;
  }

  async enrichUniversity(university: University): Promise<University> {
    // Run each enrichment task independently and catch errors
    const [
      linkedInResult,
      studentPopulationResult,
      universityTypeResult,
      languageCentreResult
    ] = await Promise.all([
      this.safeExecute(() => this.linkedInAgent.findLinkedInUrl(university)),
      this.safeExecute(() => this.studentPopulationAgent.findStudentPopulation(university)),
      this.safeExecute(() => this.universityTypeAgent.findUniversityType(university)),
      this.safeExecute(() => this.languageCentreAgent.findLanguageCentre(university))
    ]);

    // Log any errors that occurred
    [
      { name: 'LinkedIn', result: linkedInResult },
      { name: 'Student Population', result: studentPopulationResult },
      { name: 'University Type', result: universityTypeResult },
      { name: 'Language Centre', result: languageCentreResult }
    ].forEach(({ name, result }) => {
      if (result.error) {
        console.error(`Error enriching ${name} for ${university.name}:`, result.error);
      }
    });

    return {
      ...university,
      linkedin_url: linkedInResult.data || university.linkedin_url,
      student_population: studentPopulationResult.data || university.student_population,
      university_type: universityTypeResult.data || university.university_type,
      language_centre: languageCentreResult.data ?? university.language_centre
    };
  }

  private async safeExecute<T>(fn: () => Promise<T>): Promise<{ data: T | null; error: Error | null }> {
    try {
      const data = await fn();
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }

  async enrichUniversities(universities: University[]): Promise<University[]> {
    const limit = pLimit(this.concurrencyLimit);
    const enrichmentTasks = universities.map(university => 
      limit(async () => {
        try {
          return await this.enrichUniversity(university);
        } catch (error) {
          console.error(`Failed to enrich university ${university.name}:`, error);
          return university; // Return original university data if enrichment fails
        }
      })
    );

    return Promise.all(enrichmentTasks);
  }
}

// // Example usage:
// async function main() {
//   const universities: University[] = [
//     {
//       domain: "example.edu",
//       name: "Example University"
//     }
//     // Add more universities here
//   ];

//   const enricher = new UniversityEnricher();
//   const enrichedUniversities = await enricher.enrichUniversities(universities);
//   console.log(JSON.stringify(enrichedUniversities, null, 2));
// }

// if (require.main === module) {
//   main().catch(console.error);
// } 