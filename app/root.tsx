import {
    Links,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import stylesheet from "~/styles/tailwind.css";
import { createSupabaseServerClient } from "~/services/supabase.server";

export const links = () => [
    { rel: "stylesheet", href: stylesheet },
];

export const meta = () => {
    return [
        { title: "Notalock Store" },
        { name: "viewport", content: "width=device-width,initial-scale=1" },
    ];
};

export const loader = async ({ request }) => {
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
        if (data) {
            profile = data;
        }
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

function ClientOnly({ children }) {
    const [mounted, setMounted] = React.useState(false);
    
    React.useEffect(() => {
        setMounted(true);
    }, []);
    
    return mounted ? children : null;
}

export default function App() {
    const { env } = useLoaderData();

    return (
        <html lang="en" className="h-full">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body className="h-full">
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