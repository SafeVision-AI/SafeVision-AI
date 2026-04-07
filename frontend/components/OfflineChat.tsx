'use client';

// Stub offline chat handler to integrate with WebLLM
// Called dynamically from ChatInterface if selected.

export async function loadWebLLM(setProgress: (val: number) => void) {
  // Try to use the web-llm library dynamically if requested
  try {
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
    const engine = await CreateMLCEngine('Phi-3-mini-4k-instruct-q4f16_1-MLC', {
      initProgressCallback: (progress) => {
        // e.g., progress { text: string, progress: number }
        setProgress(progress.progress * 100);
      }
    });
    return engine;
  } catch (error) {
    console.error("Failed to load offline model:", error);
    throw error;
  }
}
