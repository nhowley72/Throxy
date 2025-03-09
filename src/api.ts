import axios, { AxiosError } from 'axios';
import { ThroxyResponse } from './types';

const THROXY_BASE_URL = 'https://app.throxy.ai/api/tools/web-scraping';

export class ThroxyAPI {
  private static async request<T>(endpoint: string, params: any = {}, method: 'GET' | 'POST' = 'GET'): Promise<T> {
    try {
      console.log(`Making Throxy API ${method} request to ${endpoint}`, { params });
      
      const config = {
        headers: {
          'Authorization': `Bearer ${process.env.THROXY_API_KEY}`
        }
      };

      const response = method === 'GET'
        ? await axios.get<ThroxyResponse>(`${THROXY_BASE_URL}/${endpoint}`, { ...config, params })
        : await axios.post<ThroxyResponse>(`${THROXY_BASE_URL}/${endpoint}`, params, config);

      if (!response.data.success) {
        console.error(`Throxy API error for ${endpoint}:`, response.data.error);
        throw new Error(response.data.error || 'Unknown error occurred');
      }

      return response.data.data as T;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        console.error(`Throxy API request failed for ${endpoint}:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        if (error.response.status === 401) {
          throw new Error('Invalid Throxy API key');
        } else if (error.response.status === 429) {
          throw new Error('Rate limit exceeded');
        } else if (error.response.status >= 500) {
          throw new Error('Throxy API server error');
        }
      }

      if (error instanceof Error) {
        throw new Error(`Throxy API Error: ${error.message}`);
      }
      throw error;
    }
  }

  static async websiteMarkdownScrape(url: string): Promise<string> {
    return this.request<string>('website-markdown-scrape', { url });
  }

  static async tavilySearch(query: string): Promise<any> {
    return this.request<any>('tavily-search', { query }, 'POST');
  }

  static async builtWith(url: string): Promise<string[]> {
    return this.request<string[]>('built-with', { url });
  }
} 