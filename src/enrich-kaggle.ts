import { processUniversities, saveUniversities } from './data-processor';
import { UniversityEnricher } from './index';
import path from 'path';

async function main() {
  try {
    // Process universities from the Kaggle dataset
    console.log('Processing universities from Kaggle dataset...');
    const universities = await processUniversities('data/world-universities.csv');
    
    // Save the initial filtered dataset
    await saveUniversities(universities, 'output/filtered_universities.json');
    
    // Create enricher instance
    const enricher = new UniversityEnricher(5); // Process 5 universities concurrently
    
    // Enrich universities in batches to avoid rate limits, this also isnt needed but I dont know what the limtis are with tier 5 so i thought id play it safe
    const BATCH_SIZE = 20;
    const enrichedUniversities = [];
    
    for (let i = 0; i < universities.length; i += BATCH_SIZE) {
      const batch = universities.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(universities.length / BATCH_SIZE)}`);
      
      const enrichedBatch = await enricher.enrichUniversities(batch);
      enrichedUniversities.push(...enrichedBatch);
      
      // Save progress after each batch
      await saveUniversities(
        enrichedUniversities,
        'output/enriched_universities_kaggle.json'
      );
      
      // Add a delay between batches to respect rate limits - this is also outdated as we're using tier 5
      if (i + BATCH_SIZE < universities.length) {
        console.log('Waiting 30 seconds before processing next batch...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    console.log('Enrichment complete!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
} 