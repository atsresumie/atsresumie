# Supabase Edge Functions

This directory contains Supabase Edge Functions for background job processing.

## Functions

### process-generation-job

Processes resume tailoring jobs from the `generation_jobs` queue.

**Trigger:** HTTP POST with `{ jobId: string }`

**Flow:**
1. Fetch job and validate status is 'queued'
2. Mark job as 'running'
3. Fetch associated draft (JD, resume)
4. Download resume from storage
5. Generate tailored resume (call your AI service)
6. Upload PDF to `generated-resumes` bucket
7. Create `tailored_outputs` record
8. Mark job as 'succeeded'

## Deployment

```bash
# Install Supabase CLI if not already
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy function
supabase functions deploy process-generation-job
```

## Environment Variables

Set in Supabase Dashboard → Edge Functions → Secrets:

- `SUPABASE_URL` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-set)
- `OPENAI_API_KEY` (optional, for AI-powered tailoring)

## Invoking the Function

From your Next.js app or a database trigger:

```typescript
const { data, error } = await supabase.functions.invoke('process-generation-job', {
  body: { jobId: 'uuid-here' },
});
```

Or set up a pg_cron job to poll for queued jobs.
