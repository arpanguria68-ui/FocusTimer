import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { generateGeminiResponse } from '@/lib/gemini';
import { cn } from '@/lib/utils';

interface AiQuoteGeneratorProps {
  onGenerateQuote: (quote: string, author: string, category: string) => void;
}

export function AiQuoteGenerator({ onGenerateQuote }: AiQuoteGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedQuote, setGeneratedQuote] = useState('');
  const [generatedAuthor, setGeneratedAuthor] = useState('');
  const [generatedCategory, setGeneratedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQuote = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedQuote('');
    setGeneratedAuthor('');
    setGeneratedCategory('');

    try {
      const geminiApiKey = localStorage.getItem('gemini_api_key');
      const geminiModel = localStorage.getItem('gemini_model') || 'gemini-pro';

      if (!geminiApiKey) {
        setError('Gemini API Key is not set. Please configure it in settings.');
        setIsLoading(false);
        return;
      }

      const response = await generateGeminiResponse(
        geminiApiKey,
        `Generate a quote based on the following prompt: "${prompt}". Provide the quote, author, and a single category in a JSON format like: { "quote": "...", "author": "...", "category": "..." }`,
        geminiModel
      );

      const parsedResponse = JSON.parse(response);
      setGeneratedQuote(parsedResponse.quote);
      setGeneratedAuthor(parsedResponse.author);
      setGeneratedCategory(parsedResponse.category);
      onGenerateQuote(parsedResponse.quote, parsedResponse.author, parsedResponse.category);

    } catch (err) {
      console.error('Error generating quote:', err);
      setError(`Failed to generate quote: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Enter a prompt for the AI to generate a quote (e.g., 'a motivational quote about perseverance', 'a funny quote about coding')..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        disabled={isLoading}
      />
      <Button onClick={handleGenerateQuote} disabled={isLoading || !prompt.trim()}>
        {isLoading ? 'Generating...' : 'Generate Quote with AI'}
      </Button>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {generatedQuote && (
        <div className="border p-4 rounded-md bg-muted/50">
          <p className="italic">"{generatedQuote}"</p>
          <p className="text-right mt-2">- {generatedAuthor} <span className="text-sm text-muted-foreground">({generatedCategory})</span></p>
        </div>
      )}
    </div>
  );
}