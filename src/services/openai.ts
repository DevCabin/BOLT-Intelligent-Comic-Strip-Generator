import OpenAI from 'openai';

// Initialize OpenAI client only when API key is available
let openai: OpenAI | null = null;

const initializeOpenAI = () => {
  if (!openai && import.meta.env.VITE_OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
  }
  return openai;
};

export interface ImageGenerationOptions {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
  model?: 'dall-e-2' | 'dall-e-3';
}

export const generateImage = async (options: ImageGenerationOptions): Promise<string> => {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    }

    const client = initializeOpenAI();
    if (!client) {
      throw new Error('Failed to initialize OpenAI client');
    }

    // Enhanced prompt engineering with model-specific optimizations
    const model = options.model || 'dall-e-2';
    let enhancedPrompt: string;
    
    if (model === 'dall-e-2') {
      enhancedPrompt = `Anime manga style: ${options.prompt}. Bold black outlines, flat cel-shaded colors, 2D illustration, not photographic.`;
    } else {
      enhancedPrompt = `Anime manga style: ${options.prompt}. Bold outlines, flat colors, clean digital illustration.`;
    }

    const response = await client.images.generate({
      prompt: enhancedPrompt,
      size: options.size || '1024x1024',
      n: options.n || 1,
      model: model,
      // Only include quality and style for DALL-E 3
      ...(model === 'dall-e-3' && {
        quality: options.quality || 'standard',
        style: options.style || 'vivid'
      })
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    return imageUrl;
  } catch (error) {
    console.error('Error generating image with OpenAI:', error);
    throw error;
  }
};

export const isOpenAIConfigured = (): boolean => {
  return !!import.meta.env.VITE_OPENAI_API_KEY;
};