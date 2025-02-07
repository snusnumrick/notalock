import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import * as build from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import stylesheet from '~/styles/tailwind.css';
import { createSupabaseServerClient } from '~/server/services/supabase.server';
import { Session } from '@supabase/supabase-js';

export const links = () => [{ rel: 'stylesheet', href: stylesheet }];

export const meta = () => {
  return [
    { title: 'Notalock Store' },
    { name: 'viewport', content: 'width=device-width,initial-scale=1' },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  const {
    data: { session: supabaseSession },
  } = await supabase.auth.getSession();

  let profile = null;
  if (supabaseSession?.user.id) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', supabaseSession.user.id)
      .single();
    if (data) {
      profile = data;
    }
  }

  return build.json(
    {
      session: supabaseSession,
      profile,
      env: {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      },
    },
    {
      headers: response.headers,
    }
  );
};

interface LoaderData {
  session: Session | null;
  profile: { role: string } | null;
  env: {
    SUPABASE_URL: string | undefined;
    SUPABASE_ANON_KEY: string | undefined;
  };
}

export default function App() {
  const { env } = useLoaderData<LoaderData>();

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
