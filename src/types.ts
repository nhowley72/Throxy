export interface University {
  domain: string;
  name: string;
  city?: string;
  country?: string;
  country_code?: string;
  linkedin_url?: string;
  student_population?: number;
  university_type?: 'public' | 'private';
  language_centre?: boolean;
  tech_stack?: string[];
}

export interface ThroxyResponse {
  success: boolean;
  data: any;
  error?: string;
}

export interface AgentResult<T> {
  success: boolean;
  value: T | null;
  error?: string;
} 