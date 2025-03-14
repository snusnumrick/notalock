// This file is retained as a redirect handler
import { redirect } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';

export const loader: LoaderFunction = async () => {
  // Redirect to the products page with the newest sort order
  return redirect('/products?sortOrder=newest');
};
