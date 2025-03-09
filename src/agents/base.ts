import { OpenAI } from 'openai';
import { z } from 'zod';
import { config } from 'dotenv';
import { AgentResult } from '../types';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

// Load environment variables
config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export abstract class BaseAgent<T, TResponse = any> {
  protected abstract prompt: string;
  protected abstract outputSchema: z.ZodType<TResponse>;

  protected async runAgent(university: { name: string; domain: string }): Promise<AgentResult<T>> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are a helpful assistant that gathers information about universities.
You have extensive knowledge about universities worldwide and can provide accurate information.
When you're not completely sure about information, you should indicate that in your response.
Format your responses as JSON objects according to the specific format requested in the prompt.`
        },
        {
          role: 'user',
          content: this.formatPrompt(university)
        }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const message = completion.choices[0].message;
      const parsed = this.outputSchema.safeParse(JSON.parse(message.content || '{}'));
      if (!parsed.success) {
        return { success: false, value: null, error: 'Failed to parse agent output' };
      }

      return { success: true, value: this.transformOutput(parsed.data) };
    } catch (error) {
      return {
        success: false,
        value: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  protected abstract transformOutput(data: TResponse): T;
  protected abstract formatPrompt(university: { name: string; domain: string }): string;
} 