// app/root.tsx
import {
    Links,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
} from "@remix-run/react";
import { json, type LoaderFunction } from "@remix-run/node";
import stylesheet from "~/tailwind.css";
import { createSupabaseServerClient } from "~/services/supabase.server";

export const links = () => [
    { rel: "stylesheet", href: stylesheet },
];

export const loader: LoaderFunction = async ({ request }) => {
    const response = new Response();
    const supabase = createSupabaseServerClient({ request, response });
    const { data: { session } } = await supabase.auth.getSession();

    return json(
        {
            session,
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

export default function App() {
    const { env } = useLoaderData<typeof loader>();

    return (
        <html lang="en">
        <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <Meta />
            <Links />
        </head>
        <body>
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