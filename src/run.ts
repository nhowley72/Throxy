import { config } from 'dotenv';
import { UniversityEnricher } from './index';
import { University } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Load environment variables
config();

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'THROXY_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

async function loadUniversities(): Promise<University[]> {
  // This is outdated as we're now just using data/universities.csv to load universities
  return [
    {
      domain: "uba.ar",
      name: "Universidad de Buenos Aires"
    },
    {
      domain: "unam.mx",
      name: "Universidad Nacional Autónoma de México"
    },
    {
      domain: "puc.cl",
      name: "Pontificia Universidad Católica de Chile"
    }
  ];
}

async function main() {
  try {
    const universities = await loadUniversities();
    const enricher = new UniversityEnricher(3); // Limit to 3 concurrent requests
    
    console.log('Starting university data enrichment...');
    const enrichedUniversities = await enricher.enrichUniversities(universities);
    
    // Save results
    const outputPath = path.join(__dirname, '..', 'output');
    await fs.mkdir(outputPath, { recursive: true });
    await fs.writeFile(
      path.join(outputPath, 'enriched_universities.json'),
      JSON.stringify(enrichedUniversities, null, 2)
    );
    
    console.log('Enrichment complete! Results saved to output/enriched_universities.json');
  } catch (error) {
    console.error('Error during enrichment:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} 