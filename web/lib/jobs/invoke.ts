import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Invoke the process-generation-job Edge Function to start processing a job.
 * 
 * This should be called after claiming a session and receiving a jobId.
 * The function processes the job asynchronously.
 * 
 * @param jobId - The generation job ID to process
 * @returns Promise with the result of the invocation
 */
export async function invokeJobProcessor(jobId: string): Promise<{
  success: boolean;
  pdfPath?: string;
  error?: string;
}> {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase.functions.invoke("process-generation-job", {
    body: { jobId },
  });

  if (error) {
    console.error("Failed to invoke job processor:", error);
    return { success: false, error: error.message };
  }

  return data;
}
