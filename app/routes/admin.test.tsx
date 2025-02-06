import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import {
  useLoaderData,
  Form,
  useActionData,
  isRouteErrorResponse,
  useRouteError,
} from '@remix-run/react';
import { requireAdmin } from '~/utils/auth.server';

interface Category {
  id: string;
  name: string;
  description: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { user, profile, response, supabase } = await requireAdmin(request);

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');

    if (categoriesError) {
      throw json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return json(
      {
        categories,
        isAdmin: profile.role === 'admin',
        userEmail: user.email,
        debugInfo: {
          hasSession: true,
          userId: user.id,
          hasProfile: true,
          profileRole: profile.role,
        },
      },
      {
        headers: response.headers,
      }
    );
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error('Admin test loader error:', error);
    throw json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { response, supabase } = await requireAdmin(request);

    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');

    if (!name || !description || typeof name !== 'string' || typeof description !== 'string') {
      throw json({ error: 'Name and description are required' }, { status: 400 });
    }

    // Validate input
    if (name.length < 2 || name.length > 50) {
      throw json({ error: 'Name must be between 2 and 50 characters' }, { status: 400 });
    }

    if (description.length < 10 || description.length > 500) {
      throw json({ error: 'Description must be between 10 and 500 characters' }, { status: 400 });
    }

    // Check for duplicate name
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (checkError) {
      throw json({ error: 'Failed to check for existing category' }, { status: 500 });
    }

    if (existing) {
      throw json({ error: 'A category with this name already exists' }, { status: 400 });
    }

    // Insert new category
    const { data, error: insertError } = await supabase
      .from('categories')
      .insert([{ name, description }])
      .select()
      .single();

    if (insertError) {
      throw json({ error: 'Failed to create category' }, { status: 500 });
    }

    return json({ success: true, data }, { headers: response.headers });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error('Admin test action error:', error);
    throw json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
};

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {error.status} {error.statusText}
          </h1>
          <p className="text-gray-600">{error.data.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600">An unexpected error occurred. Please try again later.</p>
      </div>
    </div>
  );
}

export default function AdminTest() {
  const { categories, isAdmin, userEmail } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Test Page</h1>

      <div className="mb-8">
        <h2 className="text-xl mb-2">Current User</h2>
        <p>Email: {userEmail || 'Not logged in'}</p>
        <p>Admin Status: {isAdmin ? '✅ Is Admin' : '❌ Not Admin'}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl mb-2">Add Category (Admin Only)</h2>
        <Form method="post" className="space-y-4">
          {actionData?.error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
              {actionData.error}
            </div>
          )}
          {actionData?.success && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
              Category created successfully!
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name:
              <input
                type="text"
                name="name"
                minLength={2}
                maxLength={50}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="mt-1 text-sm text-gray-500">Between 2 and 50 characters</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description:
              <textarea
                name="description"
                minLength={10}
                maxLength={500}
                required
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="mt-1 text-sm text-gray-500">Between 10 and 500 characters</span>
            </label>
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Category
          </button>
        </Form>
      </div>

      <div>
        <h2 className="text-xl mb-2">Existing Categories</h2>
        {categories?.length === 0 ? (
          <p className="text-gray-500">No categories found.</p>
        ) : (
          <ul className="space-y-2">
            {categories?.map((category: Category) => (
              <li key={category.id} className="p-4 bg-white shadow rounded-lg">
                <h3 className="font-medium text-gray-900">{category.name}</h3>
                <p className="mt-1 text-gray-600">{category.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
