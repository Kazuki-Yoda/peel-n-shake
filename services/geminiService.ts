
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { EditSuggestionCategories, SuggestionPreview } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const imageEditModel = 'gemini-2.5-flash-image-preview';
const textModel = 'gemini-2.5-flash';

/**
 * Converts a File object to a base64 encoded string and its MIME type.
 * @param file The file to convert.
 * @returns A promise that resolves to an object with base64 data and mimeType.
 */
const fileToGenerativePart = async (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(';base64,');
      if (!header || !data) {
        return reject(new Error("Invalid file format"));
      }
      const mimeType = header.split(':')[1];
      if(!mimeType){
        return reject(new Error("Could not determine mime type"));
      }
      resolve({ mimeType, data });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Applies a single edit prompt to a base64 image.
 * @param imageBase64 The base64 encoded image data.
 * @param mimeType The MIME type of the image.
 * @param prompt The text prompt for the edit.
 * @returns A promise that resolves to the base64 data URL of the edited image.
 */
const applySingleEdit = async (imageBase64: string, mimeType: string, prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: imageEditModel,
    contents: {
      parts: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

  if (imagePart?.inlineData) {
    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  } else {
    const textResponse = response.text?.trim();
    const errorMessage = textResponse ? `Model returned text instead of image: "${textResponse}"` : "Model did not return an image. The request may have been filtered.";
    throw new Error(errorMessage);
  }
};


/**
 * Applies a sequence of edit prompts to an image file.
 * @param file The initial image file.
 * @param prompts An array of text prompts to apply in sequence.
 * @param onStep A callback function that is called before each edit step.
 * @returns A promise that resolves to the base64 data URL of the final edited image.
 */
export const applyEditSequence = async (
    file: File, 
    prompts: string[], 
    onStep?: (promptIndex: number) => void
): Promise<string> => {
    
    let { mimeType, data: currentImageBase64 } = await fileToGenerativePart(file);
    const appliedPrompts: string[] = [];

    for (let i = 0; i < prompts.length; i++) {
        if (onStep) {
            onStep(i);
        }
        const currentPrompt = prompts[i];
        
        let contextualPrompt = currentPrompt;
        if (appliedPrompts.length > 0) {
            const previousEdits = appliedPrompts.map((p, index) => `Step ${index + 1}: "${p}"`).join('; ');
            contextualPrompt = `You have already performed the following edits in order: ${previousEdits}. Now, please apply this new edit to the image: "${currentPrompt}".`;
        }
        
        const preservationInstruction = "IMPORTANT: You must preserve any people in the image. Do not change their faces, bodies, or identities. The core subjects of the photo should remain recognizable after the edit.";
        
        const finalPrompt = `${contextualPrompt} ${preservationInstruction}`;

        const editedDataUrl = await applySingleEdit(currentImageBase64, mimeType, finalPrompt);

        // Keep track of the original prompts for the next step's context
        appliedPrompts.push(currentPrompt);

        // Prepare for the next iteration
        const [header, data] = editedDataUrl.split(';base64,');
        const newMimeType = header.split(':')[1];

        if (!data || !newMimeType) {
            throw new Error('Invalid data URL returned from API');
        }

        currentImageBase64 = data;
        mimeType = newMimeType;
    }

    return `data:${mimeType};base64,${currentImageBase64}`;
};

/**
 * Generates categorized creative edit suggestions for a given image, streaming updates via a callback.
 * @param file The image file to analyze.
 * @param onUpdate A callback function that receives the suggestion data as it's generated.
 * @returns A promise that resolves when all suggestion generation is complete.
 */
export const getEditSuggestions = async (
    file: File,
    onUpdate: (suggestions: EditSuggestionCategories) => void
): Promise<void> => {
    const { mimeType, data: originalImageData } = await fileToGenerativePart(file);

    const textPromptResponse = await ai.models.generateContent({
        model: textModel,
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType,
                        data: originalImageData,
                    },
                },
                {
                    text: `Analyze this image and provide creative edit suggestions.
                           The suggestions should be concise and actionable phrases, like a prompt.
                           For example: "Make the sky look like a sunset", "Add a curious robot in the corner", or "Apply a vintage film effect".
                           Provide exactly 3 suggestions for each of the following categories:
                           1. 'realistic': Subtle, plausible changes that improve the photo's quality or composition.
                           2. 'fun': Creative and imaginative additions or transformations.
                           3. 'experimental': Abstract, artistic, or unusual edits.`
                },
            ],
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    realistic: {
                        type: Type.ARRAY,
                        description: "3 realistic and subtle edit suggestions.",
                        items: { type: Type.STRING },
                    },
                    fun: {
                        type: Type.ARRAY,
                        description: "3 fun and creative edit suggestions.",
                        items: { type: Type.STRING },
                    },
                    experimental: {
                        type: Type.ARRAY,
                        description: "3 experimental and unusual edit suggestions.",
                        items: { type: Type.STRING },
                    },
                },
                required: ['realistic', 'fun', 'experimental'],
            },
        },
    });
    
    const responseText = textPromptResponse.text.trim();
    if (!responseText) {
        throw new Error("Model returned an empty response for suggestions.");
    }

    let parsedPrompts: { realistic: string[], fun: string[], experimental: string[] };
    try {
        const parsed = JSON.parse(responseText);
        if (parsed.realistic && parsed.fun && parsed.experimental) {
            parsedPrompts = parsed;
        } else {
            throw new Error("Invalid JSON structure for categorized suggestions.");
        }
    } catch (e) {
        console.error("Failed to parse suggestions JSON:", responseText);
        throw new Error("Model returned an invalid format for suggestions.");
    }
    
    const categories: Array<keyof EditSuggestionCategories> = ['realistic', 'fun', 'experimental'];
    const currentSuggestions: EditSuggestionCategories = {
        realistic: parsedPrompts.realistic.map(p => ({ prompt: p, previewImage: '' })),
        fun: parsedPrompts.fun.map(p => ({ prompt: p, previewImage: '' })),
        experimental: parsedPrompts.experimental.map(p => ({ prompt: p, previewImage: '' })),
    };
    
    // First update: send the text-only suggestions
    onUpdate(JSON.parse(JSON.stringify(currentSuggestions)));

    const previewPromises = categories.flatMap(category =>
        parsedPrompts[category].map((prompt, index) =>
            applySingleEdit(originalImageData, mimeType, prompt)
                .then(previewImage => {
                    currentSuggestions[category][index].previewImage = previewImage;
                    onUpdate(JSON.parse(JSON.stringify(currentSuggestions)));
                })
                .catch(err => {
                    console.warn(`Could not generate preview for prompt "${prompt}":`, err);
                    currentSuggestions[category][index].previewImage = 'error';
                    onUpdate(JSON.parse(JSON.stringify(currentSuggestions)));
                })
        )
    );

    await Promise.all(previewPromises);
};
