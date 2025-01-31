// app/services/supabase.server.ts
import { createServerClient } from "@supabase/auth-helpers-remix";
import type { Database } from "~/types/supabase";

export const createSupabaseServerClient = ({
                                               request,
                                               response,
                                           }: {
    request: Request;
    response: Response;
}) => {
    if (!process.env.SUPABASE_URL) throw new Error("SUPABASE_URL is required");
    if (!process.env.SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY is required");

    const supabase = createServerClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            request,
            response,
            // Add these options for better cookie handling
            cookies: {
                // These are the defaults, but let's be explicit
                name: 'sb',
                lifetime: 60 * 60 * 8, // 8 hours
                domain: '',
                path: '/',
                sameSite: 'lax',
            },
        }
    );

    return supabase;
};