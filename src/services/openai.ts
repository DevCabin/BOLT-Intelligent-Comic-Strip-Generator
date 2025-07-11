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
      // DALL-E 2 requires very explicit anti-photorealistic instructions
      enhancedPrompt = `DIGITAL ILLUSTRATION NOT PHOTOGRAPH: ${options.prompt}. 
      
      MANDATORY STYLE: Hand-drawn anime manga artwork, 2D flat illustration, cartoon style, NOT realistic, NOT photographic, NOT 3D rendered. 
      
      VISUAL REQUIREMENTS: Bold black ink outlines, flat cel-shaded colors, solid color fills, no gradients, no shadows, no realistic lighting, no photorealistic textures, clean vector art style, traditional Japanese manga art style, simple geometric shapes, bright saturated colors.
      
      FORBIDDEN: No photographs, no realistic people, no stock photos, no 3D renders, no realistic lighting, no photographic backgrounds, no real-world imagery.
      
      ARTISTIC STYLE: Similar to Dragon Ball Z, Naruto, One Piece manga panels - pure 2D illustration style.`;
    } else {
      // DALL-E 3 handles style instructions better
      enhancedPrompt = `Anime manga style digital artwork: ${options.prompt}. Clean vector art style, bold black outlines, flat cel-shaded colors, no gradients, sharp clean lines, solid color fills, traditional anime character design, manga panel style, crisp digital illustration, professional anime production art style, digital cel animation style, not realistic or photographic.`;
    }

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