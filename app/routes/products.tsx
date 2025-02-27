import type { MetaFunction } from '@remix-run/node';
import { Outlet } from '@remix-run/react';
import { Header } from '~/components/common/Header';

export const meta: MetaFunction = () => {
  return [
    { title: 'Products - Notalock' },
    { name: 'description', content: 'Browse our collection of European door hardware' },
  ];
};

export default function ProductsLayout() {
  return (
    <div className="bg-white flex-grow">
      <Header />
      <main className="pt-24">
        <Outlet />
      </main>
    </div>
  );
}
