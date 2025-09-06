
import { fal } from "./falClient";  // Using our custom client implementation

export async function requestFalImageEdit(
    model: string,
    prompt: string, 
    image_url: string,
): Promise<string> {
  const result = await fal.subscribe(model, {
    input: {
      prompt: prompt,
      image_url: image_url
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs?.map((log) => log.message).forEach(console.log);
      }
    },
  });

  console.log("Fal.ai Result Data:", result.data);
  console.log("Fal.ai Request ID:", result.requestId);

  if (result.data.status === "FAILED" || !result.data) {
    console.error("Fal.ai request failed or returned no data.");
    return "";
  }

  // Check for the common { images: [{ url: "..." }] } structure
  if (Array.isArray(result.data.images) && result.data.images.length > 0 && result.data.images[0].url) {
    return result.data.images[0].url;
  }

  // Fallback for the { image_url: "..." } structure
  if (result.data.image_url && typeof result.data.image_url === "string") {
    return result.data.image_url;
  }

  console.error("No image URL found in Fal.ai response structure.", result.data);
  return "";
}

// Export the fal client for direct use
export { fal };

// Auto-execute if this file is run directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   requestFalImageEdit(
//     "fal-ai/flux-pro/kontext/max",
//     "Put a donut next to the flour.", 
//     "https://v3.fal.media/files/rabbit/rmgBxhwGYb2d3pl3x9sKf_output.png"
//   ).catch(console.error);
// }
