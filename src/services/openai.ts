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

    // Enhance the prompt for comic-style generation
    const enhancedPrompt = `Full body shot, wide angle view, Japanese manga style illustration: ${options.prompt}. Complete character visible from head to toe, full scene composition, anime art style, clean sharp line art, cel-shaded flat colors, bold outlines, manga panel composition, detailed but not impressionistic, clear defined shapes, solid colors, professional manga artwork, wide shot perspective, full frame composition, not cropped, complete subject in frame.`;

    const model = options.model || 'dall-e-2';
    const generateOptions: any = {
      model,
      prompt: enhancedPrompt,
      size: options.size || '512x512',
      n: options.n || 1,
    };

    // DALL-E 3 specific options
    if (model === 'dall-e-3') {
      generateOptions.quality = options.quality || 'standard';
      generateOptions.style = options.style || 'vivid';
      generateOptions.n = 1; // DALL-E 3 only supports n=1
    }

    const response = await client.images.generate(generateOptions);

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