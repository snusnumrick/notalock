import { json, redirect } from '@remix-run/node';
import { Form, Link } from '@remix-run/react';
import type { ActionFunctionArgs } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);
  const formData = await request.formData();
  const action = formData.get('action');

  if (action === 'logout') {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return json({ error: 'Failed to sign out' }, { status: 500 });
    }
    return redirect('/login', {
      headers: response.headers,
    });
  }

  return null;
};

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Unauthorized Access</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          You don&apos;t have permission to access this page.
        </p>
        <div className="mt-4 flex flex-col items-center space-y-4">
          <Link to="/" className="text-blue-600 hover:text-blue-500">
            Return Home
          </Link>
          <Form method="post">
            <input type="hidden" name="action" value="logout" />
            <button type="submit" className="text-red-600 hover:text-red-500">
              Sign out and login as admin
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
