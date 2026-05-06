import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const jsonHeaders = {
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  const expectedSecret = Deno.env.get("SCHEDULED_JOBS_SECRET");
  const receivedSecret = req.headers.get("x-scheduled-jobs-secret");

  if (!expectedSecret) {
    return new Response(
      JSON.stringify({ error: "SCHEDULED_JOBS_SECRET is not configured" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  if (receivedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Supabase service credentials are not configured" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const startedAt = Date.now();
  const { data, error } = await supabase.rpc("run_scheduled_jobs");

  if (error) {
    console.error("[run-scheduled-jobs] RPC failed:", error);

    return new Response(
      JSON.stringify({
        error: "Scheduled jobs failed",
        details: error.message,
      }),
      { status: 500, headers: jsonHeaders },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      duration_ms: Date.now() - startedAt,
      result: data,
    }),
    { status: 200, headers: jsonHeaders },
  );
});
