import { createServerClient } from "@supabase/ssr";
import { redirect } from "@remix-run/node";

export async function requireAdmin(request: Request) {
    const response = new Response();
    const cookies = request.headers.get("Cookie") ?? "";

    const supabase = createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            cookies: {
                get: (key) => {
                    const cookie = cookies.split(';').find(c => c.trim().startsWith(`${key}=`));
                    return cookie ? cookie.split('=')[1] : null;
                },
                set: (key, value, options) => {
                    response.headers.append('Set-Cookie', `${key}=${value}; Path=/; HttpOnly; SameSite=Lax`);
                },
                remove: (key, options) => {
                    response.headers.append('Set-Cookie', `${key}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw redirect("/login");
    }

    // Get user profile and check admin role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profileError || profile?.role !== 'admin') {
        throw redirect("/unauthorized");
    }

    return {
        user: session.user,
        profile,
        response,
        supabase
    };
}