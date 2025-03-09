import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { University } from './types';

// Country mapping with their ISO codes and variations
const COUNTRY_MAPPING = {
  'AR': { name: 'Argentina', variations: ['Argentina', 'Argentine Republic'] },
  'BO': { name: 'Bolivia', variations: ['Bolivia', 'Plurinational State of Bolivia'] },
  'BR': { name: 'Brazil', variations: ['Brazil', 'Brasil', 'Federative Republic of Brazil'] },
  'CL': { name: 'Chile', variations: ['Chile', 'Republic of Chile'] },
  'CO': { name: 'Colombia', variations: ['Colombia', 'Republic of Colombia'] },
  'CR': { name: 'Costa Rica', variations: ['Costa Rica', 'Republic of Costa Rica'] },
  'CU': { name: 'Cuba', variations: ['Cuba', 'Republic of Cuba'] },
  'DO': { name: 'Dominican Republic', variations: ['Dominican Republic', 'República Dominicana'] },
  'EC': { name: 'Ecuador', variations: ['Ecuador', 'Republic of Ecuador'] },
  'SV': { name: 'El Salvador', variations: ['El Salvador', 'Republic of El Salvador'] },
  'GT': { name: 'Guatemala', variations: ['Guatemala', 'Republic of Guatemala'] },
  'HN': { name: 'Honduras', variations: ['Honduras', 'Republic of Honduras'] },
  'MX': { name: 'Mexico', variations: ['Mexico', 'México', 'United Mexican States'] },
  'PA': { name: 'Panama', variations: ['Panama', 'Republic of Panama', 'Panamá'] },
  'PY': { name: 'Paraguay', variations: ['Paraguay', 'Republic of Paraguay'] },
  'PE': { name: 'Peru', variations: ['Peru', 'Perú', 'Republic of Peru'] },
  'UY': { name: 'Uruguay', variations: ['Uruguay', 'Oriental Republic of Uruguay'] },
  'ES': { name: 'Spain', variations: ['Spain', 'España', 'Kingdom of Spain'] },
  'TR': { name: 'Turkey', variations: ['Turkey', 'Türkiye', 'Republic of Turkey', 'Turkiye'] }
} as const;

type CountryCode = keyof typeof COUNTRY_MAPPING;

// Create a map of variations to ISO codes for easy lookup
const COUNTRY_VARIATIONS_TO_ISO = Object.entries(COUNTRY_MAPPING).reduce((acc, [code, data]) => {
  data.variations.forEach(variation => {
    acc[variation.toLowerCase()] = code as CountryCode;
  });
  return acc;
}, {} as Record<string, CountryCode>);

function getCountryCode(countryCode: string | undefined): CountryCode | null {
  if (!countryCode) return null;
  return Object.keys(COUNTRY_MAPPING).includes(countryCode) ? countryCode as CountryCode : null;
}

function getStandardCountryName(countryCode: string | undefined): string | null {
  const code = getCountryCode(countryCode);
  return code ? COUNTRY_MAPPING[code].name : null;
}

export async function processUniversities(csvFilePath: string): Promise<University[]> {
  const universities: University[] = [];
  let rowCount = 0;
  
  // First check if file exists
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found at path: ${csvFilePath}`);
  }
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(parse({
        columns: ['country_code', 'name', 'website'],
        skip_empty_lines: true,
        trim: true
      }))
      .on('data', (row: any) => {
        rowCount++;
        try {
          // Log the first row to see the structure
          if (rowCount === 1) {
            console.log('First row structure:', row);
          }

          const standardCountryName = getStandardCountryName(row.country_code);
          if (standardCountryName) {
            const countryCode = getCountryCode(row.country_code);
            const domain = row.website?.replace(/^https?:\/\//i, '').replace(/\/$/, '') || '';
            
            if (domain) {
              universities.push({
                name: row.name || '',
                domain,
                country: standardCountryName,
                country_code: countryCode || ''
              });
            }
          }
        } catch (error) {
          console.error(`Error processing row ${rowCount}:`, error);
          console.error('Row data:', row);
        }
      })
      .on('end', () => {
        console.log(`Processed ${rowCount} rows from CSV`);
        console.log(`Found ${universities.length} valid universities in target countries`);
        
        // Log country distribution
        const countryDistribution = universities.reduce((acc, uni) => {
          const country = uni.country || 'Unknown';
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log('\nUniversities by country:');
        Object.entries(countryDistribution)
          .sort(([, a], [, b]) => b - a)
          .forEach(([country, count]) => {
            console.log(`${country}: ${count}`);
          });
        
        resolve(universities);
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}

export async function saveUniversities(universities: University[], outputPath: string): Promise<void> {
  await fs.promises.writeFile(
    outputPath,
    JSON.stringify(universities, null, 2)
  );
  console.log(`Saved ${universities.length} universities to ${outputPath}`);
} 