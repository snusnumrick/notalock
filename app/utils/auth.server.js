// app/utils/auth.server.js
import { redirect } from "@remix-run/node";
import { createSupabaseServerClient } from "~/services/supabase.server";

export async function requireUser(request) {
    const response = new Response();
    const supabase = createSupabaseServerClient({ request, response });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw redirect("/login");
    }

    return { user, response, supabase };
}

export async function requireAdmin(request) {
    const { user, response, supabase } = await requireUser(request);

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || profile?.role !== 'admin') {
        throw redirect("/unauthorized");
    }

    return { user, profile, response, supabase };
}

export async function getUser(request) {
    const response = new Response();
    const supabase = createSupabaseServerClient({ request, response });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return { user: null, response, supabase };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return { user, profile, response, supabase };
}