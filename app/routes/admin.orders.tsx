import { Outlet } from '@remix-run/react';
import { requireAdmin } from '~/server/middleware/auth.server';
import { type LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify the user is an admin
  await requireAdmin(request);

  console.log('🔍 ORDERS LAYOUT LOADER RUNNING');

  return null;
}

export default function OrdersLayout() {
  console.log('🔍 ORDERS LAYOUT COMPONENT RENDERING');

  return <Outlet />;
}
