// app/routes/admin.test.tsx
import { json, type ActionFunction, type LoaderFunction } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { requireAdmin } from "~/utils/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
    const { user, profile, response, supabase } = await requireAdmin(request);

    const { data: categories } = await supabase
        .from('categories')
        .select('*');

    return json({
        categories,
        isAdmin: profile.role === 'admin',
        userEmail: user.email,
        debugInfo: {
            hasSession: true,
            userId: user.id,
            hasProfile: true,
            profileRole: profile.role
        }
    }, {
        headers: response.headers
    });
};

export const action: ActionFunction = async ({ request }) => {
    const { response, supabase } = await requireAdmin(request);

    const formData = await request.formData();
    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString();

    if (!name || !description) {
        return json({ error: "Name and description are required" }, {
            headers: response.headers
        });
    }

    const { data, error } = await supabase
        .from('categories')
        .insert([{ name, description }]);

    if (error) {
        return json({ error: error.message }, {
            headers: response.headers
        });
    }

    return json({ success: true, data }, {
        headers: response.headers
    });
};

export default function AdminTest() {
    const { categories, isAdmin, userEmail } = useLoaderData<typeof loader>();

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
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Name:
                            <input
                                type="text"
                                name="name"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Description:
                            <input
                                type="text"
                                name="description"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add Category
                    </button>
                </Form>
            </div>

            <div>
                <h2 className="text-xl mb-2">Existing Categories</h2>
                <ul className="space-y-2">
                    {categories?.map((category) => (
                        <li key={category.id} className="p-2 bg-gray-50 rounded">
                            <strong>{category.name}</strong>: {category.description}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}