// app/routes/login.tsx
import { json, redirect, type ActionFunction, type LoaderFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { createSupabaseServerClient } from "~/services/supabase.server";
import { getUser } from "~/utils/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
    const { user, response } = await getUser(request);

    // If already logged in, redirect to home
    if (user) {
        throw redirect("/");
    }

    return json({}, {
        headers: response.headers
    });
};

export const action: ActionFunction = async ({ request }) => {
    const response = new Response();
    const supabase = createSupabaseServerClient({ request, response });

    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
        return json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return json({ error: error.message }, {
            headers: response.headers
        });
    }

    // After successful login, get the user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

    // Redirect based on role
    const redirectTo = profile?.role === 'admin' ? "/admin/test" : "/";

    return redirect(redirectTo, {
        headers: response.headers
    });
};

export default function Login() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isLoading = navigation.state === "submitting";

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    Sign in to your account
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <Form method="post" className="space-y-6">
                        {actionData?.error && (
                            <div className="text-red-600 text-sm">
                                {actionData.error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {isLoading ? "Signing in..." : "Sign in"}
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
}