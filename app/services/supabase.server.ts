// app/services/supabase.server.ts
import { createServerClient } from '@supabase/ssr'
import type { Database } from "~/types/supabase";
import { createServerClient as _createServerClient } from '@supabase/ssr'

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
            cookies: {
                get: (key) => {
                    const cookies = request.headers.get('Cookie')
                    if (!cookies) return undefined
                    const cookie = cookies.split(';').find(c => c.trim().startsWith(`${key}=`))
                    if (!cookie) return undefined
                    return decodeURIComponent(cookie.split('=')[1])
                },
                set: (key, value, options) => {
                    response.headers.append(
                        'Set-Cookie',
                        `${key}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax${
                            options?.maxAge ? `; Max-Age=${options.maxAge}` : ''
                        }`
                    )
                },
                remove: (key, options) => {
                    response.headers.append(
                        'Set-Cookie',
                        `${key}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
                    )
                },
            },
        }
    )

    return supabase;
};