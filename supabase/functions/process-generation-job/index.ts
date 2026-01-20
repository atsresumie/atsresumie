// Supabase Edge Function: process-generation-job
// Processes queued resume tailoring jobs

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface JobPayload {
  jobId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { jobId } = (await req.json()) as JobPayload;

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "jobId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing job: ${jobId}`);

    // 1. Fetch job and validate
    const { data: job, error: jobError } = await supabase
      .from("generation_jobs")
      .select("*, onboarding_drafts(*), onboarding_sessions(*)")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      console.error("Job not found:", jobError);
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (job.status !== "queued") {
      return new Response(
        JSON.stringify({ error: `Job is not queued (status: ${job.status})` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Mark job as running
    await supabase
      .from("generation_jobs")
      .update({ 
        status: "running", 
        started_at: new Date().toISOString(),
        progress: 10 
      })
      .eq("id", jobId);

    const draft = job.onboarding_drafts;
    if (!draft) {
      throw new Error("No draft found for job");
    }

    // 3. Download resume from storage
    console.log(`Downloading resume from: ${draft.resume_bucket}/${draft.resume_object_path}`);
    
    const { data: resumeData, error: downloadError } = await supabase.storage
      .from(draft.resume_bucket)
      .download(draft.resume_object_path);

    if (downloadError) {
      throw new Error(`Failed to download resume: ${downloadError.message}`);
    }

    // Update progress
    await supabase
      .from("generation_jobs")
      .update({ progress: 30 })
      .eq("id", jobId);

    // 4. Extract text from resume (simplified - in production use a proper extraction service)
    const resumeText = await extractTextFromBlob(resumeData, draft.resume_mime_type);
    console.log(`Extracted ${resumeText.length} chars from resume`);

    // Update progress
    await supabase
      .from("generation_jobs")
      .update({ progress: 50 })
      .eq("id", jobId);

    // 5. Generate tailored resume
    // TODO: Replace with actual AI service call (OpenAI, Anthropic, etc.)
    const tailoredResult = generateTailoredResume({
      jobDescription: draft.jd_text,
      resumeText,
      jdTitle: draft.jd_title,
      jdCompany: draft.jd_company,
    });

    // Update progress
    await supabase
      .from("generation_jobs")
      .update({ progress: 70 })
      .eq("id", jobId);

    // 6. Generate PDF
    // TODO: Replace with actual PDF generation (use a service like Puppeteer, jsPDF, or LaTeX compiler)
    const pdfBlob = generatePdfPlaceholder(tailoredResult.latexContent);
    
    // Upload PDF to storage
    const pdfObjectPath = `jobs/${jobId}/tailored-resume.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("generated-resumes")
      .upload(pdfObjectPath, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    console.log(`PDF uploaded to: generated-resumes/${pdfObjectPath}`);

    // Update progress
    await supabase
      .from("generation_jobs")
      .update({ progress: 90 })
      .eq("id", jobId);

    // 7. Create tailored_outputs record
    const { error: outputError } = await supabase
      .from("tailored_outputs")
      .insert({
        job_id: jobId,
        user_id: job.user_id,
        session_id: job.session_id,
        tailored_resume_json: tailoredResult.json,
        tailored_resume_text: tailoredResult.text,
        pdf_bucket: "generated-resumes",
        pdf_object_path: pdfObjectPath,
      });

    if (outputError) {
      throw new Error(`Failed to create output record: ${outputError.message}`);
    }

    // 8. Mark job as succeeded
    await supabase
      .from("generation_jobs")
      .update({ 
        status: "succeeded", 
        progress: 100,
        finished_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log(`Job ${jobId} completed successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId,
        pdfPath: `generated-resumes/${pdfObjectPath}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Job processing error:", error);

    // Try to mark job as failed
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { jobId } = await req.clone().json() as JobPayload;
      if (jobId) {
        await supabase
          .from("generation_jobs")
          .update({ 
            status: "failed", 
            error_message: error instanceof Error ? error.message : "Unknown error",
            finished_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      }
    } catch {
      // Ignore errors when trying to update failed status
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper: Extract text from blob (simplified)
async function extractTextFromBlob(blob: Blob, mimeType: string | null): Promise<string> {
  // For PDFs and DOCX, you'd use a proper extraction library
  // This is a placeholder - in production, use:
  // - pdf-parse for PDFs
  // - mammoth for DOCX
  // Or call an external extraction API
  
  if (mimeType === "application/pdf") {
    // TODO: Use pdf extraction library
    return `[PDF content extracted - ${blob.size} bytes]`;
  } else if (mimeType?.includes("wordprocessingml")) {
    // TODO: Use mammoth or similar
    return `[DOCX content extracted - ${blob.size} bytes]`;
  } else {
    // Plain text
    return await blob.text();
  }
}

// Helper: Generate tailored resume (mock implementation)
function generateTailoredResume(params: {
  jobDescription: string;
  resumeText: string;
  jdTitle?: string;
  jdCompany?: string;
}): { json: object; text: string; latexContent: string } {
  // TODO: Replace with actual AI service call
  // This is a placeholder that returns mock data
  
  const { jobDescription, resumeText, jdTitle, jdCompany } = params;
  
  // Mock tailored content
  const json = {
    summary: `Tailored professional summary for ${jdTitle || "the role"} at ${jdCompany || "the company"}`,
    skills: ["Skill 1", "Skill 2", "Skill 3"],
    experience: [
      {
        title: "Previous Role",
        bullets: [
          "Achievement aligned with job requirements",
          "Quantified impact metric",
        ],
      },
    ],
  };

  const text = `
TAILORED RESUME
===============
${jdTitle ? `Target Role: ${jdTitle}` : ""}
${jdCompany ? `Target Company: ${jdCompany}` : ""}

SUMMARY
${json.summary}

SKILLS
${json.skills.join(", ")}

EXPERIENCE
${json.experience.map(exp => `
${exp.title}
${exp.bullets.map(b => `• ${b}`).join("\n")}
`).join("\n")}
  `.trim();

  const latexContent = `
\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\begin{document}

\\section*{${jdTitle || "Professional"}}
\\textit{Tailored for ${jdCompany || "Target Company"}}

\\section*{Summary}
${json.summary}

\\section*{Skills}
${json.skills.join(", ")}

\\end{document}
  `.trim();

  return { json, text, latexContent };
}

// Helper: Generate PDF placeholder
function generatePdfPlaceholder(latexContent: string): Blob {
  // TODO: Replace with actual PDF generation
  // Options:
  // 1. Use a LaTeX compilation service
  // 2. Use Puppeteer to render HTML to PDF
  // 3. Use jsPDF
  // 4. Use an external API like DocRaptor
  
  // For now, return a simple text file as placeholder
  const placeholderContent = `
This is a placeholder PDF.
In production, this would contain the compiled LaTeX document.

LaTeX Source:
${latexContent}
  `;
  
  return new Blob([placeholderContent], { type: "application/pdf" });
}
