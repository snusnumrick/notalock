import {
    Links,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
} from "@remix-run/react";
import { json, type LoaderFunction, type V2_MetaFunction } from "@remix-run/node";
import stylesheet from "~/styles/tailwind.css";
import { createSupabaseServerClient } from "~/services/supabase.server";
import { useEffect, useState } from "react";

export const links = () => [
    { rel: "stylesheet", href: stylesheet },
];

// Add proper meta function with title
export const meta: V2_MetaFunction = () => {
    return [
        { title: "Notalock - European Door Hardware" },
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width,initial-scale=1" },
    ];
};

export const loader: LoaderFunction = async ({ request }) => {
    const response = new Response();
    const supabase = createSupabaseServerClient({ request, response });
    const { data: { session } } = await supabase.auth.getSession();

    let profile = null;
    if (session?.user.id) {
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
        profile = data;
    }

    return json(
        {
            session,
            profile,
            env: {
                SUPABASE_URL: process.env.SUPABASE_URL,
                SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
            }
        },
        {
            headers: response.headers,
        }
    );
};

function ClientOnly({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return <>{children}</>;
}

export default function App() {
    const { session, profile, env } = useLoaderData<typeof loader>();

    return (
        <html lang="en">
            <head>
                <Meta />
                <Links />
            </head>
            <body>
                <ClientOnly>
                    {session && (
                        <div className="bg-yellow-100 p-2 text-sm">
                            Logged in as {session.user.email}
                            {profile?.role && ` - Role: ${profile.role}`}
                        </div>
                    )}
                </ClientOnly>
                <Outlet />
                <ScrollRestoration />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `window.env = ${JSON.stringify(env)}`,
                    }}
                />
                <Scripts />
                <LiveReload />
            </body>
        </html>
    );
}