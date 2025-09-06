
export interface ProcessedImage {
    id: string;
    original: string; // base64 data URL
    final: string;    // base64 data URL
    name: string;
}

export interface SuggestionPreview {
    prompt: string;
    previewImage: string | 'error'; // base64 data URL, empty string for loading, or 'error'
}

export interface EditSuggestionCategories {
  realistic: SuggestionPreview[];
  fun: SuggestionPreview[];
  experimental: SuggestionPreview[];
}
