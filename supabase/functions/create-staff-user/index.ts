import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Permissions {
  can_view_orders: boolean;
  can_view_quotes: boolean;
  can_manage_products: boolean;
  can_manage_categories: boolean;
  can_manage_payment_methods: boolean;
}

interface RequestBody {
  email: string;
  password: string;
  full_name: string;
  permissions: Permissions;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: callerData, error: callerError } = await anonClient.auth.getUser(jwt);

    if (callerError || !callerData.user) {
      return new Response(JSON.stringify({ error: "Invalid session." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", callerData.user.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Only administrators can create staff accounts." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    const { email, password, full_name, permissions } = body;

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "Name, email, and password are required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, account_type: "retail" },
    });

    if (createError || !createdUser.user) {
      return new Response(
        JSON.stringify({ error: createError?.message || "Failed to create staff account." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = createdUser.user.id;

    const { error: roleError } = await supabase
      .from("profiles")
      .update({ role: "staff" })
      .eq("id", newUserId);

    if (roleError) {
      await supabase.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: "Failed to assign staff role." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: permissionsError } = await supabase.from("staff_permissions").insert({
      user_id: newUserId,
      can_view_orders: !!permissions?.can_view_orders,
      can_view_quotes: !!permissions?.can_view_quotes,
      can_manage_products: !!permissions?.can_manage_products,
      can_manage_categories: !!permissions?.can_manage_categories,
      can_manage_payment_methods: !!permissions?.can_manage_payment_methods,
    });

    if (permissionsError) {
      await supabase.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: "Failed to save staff permissions." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: newUserId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error creating staff user:", err);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
