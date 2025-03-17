import { json, redirect } from '@remix-run/node';
import { useActionData, Link } from '@remix-run/react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { HeroBannerForm } from '~/features/hero-banners/components/admin';
import { requireAdmin } from '~/server/middleware/auth.server';
import { createBannerAction } from '~/features/hero-banners/api/actions';
import { Button } from '~/components/ui/button';

export async function loader({ request }: LoaderFunctionArgs) {
  console.log('Starting admin new hero banner loader');
  try {
    await requireAdmin(request);
    console.log('Successfully loaded admin new hero banner loader');
    return json({});
  } catch (error) {
    console.log('Error in admin new hero banner loader:', error);
    if (error instanceof Response) {
      throw error; // Pass through redirects from requireAdmin
    }
    return redirect('/login?redirectTo=/admin/hero-banners/new');
  }
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  console.log('Starting admin new hero banner action');
  return createBannerAction({ request, params, context });
}

export default function NewHeroBannerPage() {
  console.log('Rendering admin new hero banner page');
  const actionData = useActionData<typeof action>();

  return (
    <div className="container space-y-6 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Hero Banner</h2>
          <p className="text-muted-foreground">Add a new hero banner to display on your homepage</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/hero-banners">Back to Hero Banners</Link>
        </Button>
      </div>

      <HeroBannerForm
        formError={actionData?.error}
        isSubmitting={false}
        onSubmit={formData => {
          formData.append('_action', 'create');
        }}
      />
    </div>
  );
}
