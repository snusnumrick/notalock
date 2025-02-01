import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ProductManagement } from "~/components/admin/ProductManagement";

export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response();

  // TODO: Add authentication and authorization checks
  return json({
    isAdmin: true
  });
};

export default function Products() {
  const { isAdmin } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProductManagement />
      </div>
    </div>
  );
}