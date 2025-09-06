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
  console.log(result.data);
  console.log(result.requestId);

  if (result.data.status === "FAILED") {
    console.error("Request failed");
    return "";
  } else if (
    result.data.image_url === null
    || typeof result.data.image_url !== "string"
  ) {
    console.error("No image URL returned");
    return "";
  }

  return result.data.image_url;
}

// Export the fal client for direct use
export { fal };

// Auto-execute if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  requestFalImageEdit(
    "fal-ai/flux-pro/kontext/max",
    "Put a donut next to the flour.", 
    "https://v3.fal.media/files/rabbit/rmgBxhwGYb2d3pl3x9sKf_output.png"
  ).catch(console.error);
}