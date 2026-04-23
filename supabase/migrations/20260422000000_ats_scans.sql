-- ats_scans: stores ATS scan history for each user
CREATE TABLE IF NOT EXISTS "public"."ats_scans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "resume_label" "text" NOT NULL,
    "resume_source" "text" NOT NULL,
    "resume_version_id" "uuid",
    "generation_job_id" "uuid",
    "jd_snippet" "text",
    "score" integer NOT NULL,
    "result_json" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ats_scans_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ats_scans_resume_source_check" CHECK (("resume_source" = ANY (ARRAY['saved'::"text", 'generated'::"text", 'paste'::"text", 'upload'::"text"]))),
    CONSTRAINT "ats_scans_score_check" CHECK (("score" >= 0 AND "score" <= 100))
);

ALTER TABLE "public"."ats_scans" OWNER TO "postgres";

-- Foreign keys
ALTER TABLE ONLY "public"."ats_scans"
    ADD CONSTRAINT "ats_scans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ats_scans"
    ADD CONSTRAINT "ats_scans_resume_version_id_fkey" FOREIGN KEY ("resume_version_id") REFERENCES "public"."resume_versions"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."ats_scans"
    ADD CONSTRAINT "ats_scans_generation_job_id_fkey" FOREIGN KEY ("generation_job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE SET NULL;

-- Indexes
CREATE INDEX "idx_ats_scans_user_id" ON "public"."ats_scans" USING "btree" ("user_id");
CREATE INDEX "idx_ats_scans_created_at" ON "public"."ats_scans" USING "btree" ("created_at" DESC);

-- RLS
ALTER TABLE "public"."ats_scans" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scans" ON "public"."ats_scans" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can create own scans" ON "public"."ats_scans" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can delete own scans" ON "public"."ats_scans" FOR DELETE USING (("auth"."uid"() = "user_id"));

-- Realtime
ALTER TABLE ONLY "public"."ats_scans" REPLICA IDENTITY FULL;
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ats_scans";

-- Grants
GRANT ALL ON TABLE "public"."ats_scans" TO "anon";
GRANT ALL ON TABLE "public"."ats_scans" TO "authenticated";
GRANT ALL ON TABLE "public"."ats_scans" TO "service_role";
