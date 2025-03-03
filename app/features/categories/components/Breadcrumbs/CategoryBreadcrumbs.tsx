import React from 'react';
import { Link, useLocation, useMatches } from '@remix-run/react';
import { categories } from '~/data/categories';
import { Category } from '~/features/categories/types/category.types';
import { findCategoryBySlug, getCategoryPath } from '~/features/categories/utils/categoryUtils';
import {
  getReferringCategory,
  clearReferringCategory,
} from '~/features/categories/utils/referringCategoryUtils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';
import { ChevronRight } from 'lucide-react';

interface CategoryBreadcrumbsProps {
  className?: string;
}

/**
 * Component for displaying breadcrumb navigation for categories
 */
export const CategoryBreadcrumbs: React.FC<CategoryBreadcrumbsProps> = ({ className = '' }) => {
  // Always call hooks at the top level, unconditionally
  // If there's an error, we'll handle it after calling the hooks
  const location = useLocation();
  const matches = useMatches() || [];

  // Add state for client-side rendering and referring category
  const [isMounted, setIsMounted] = React.useState(false);
  const [referringCategory, setReferringCategory] = React.useState<null | {
    id: string;
    name: string;
    slug: string;
    path?: string;
  }>(null);

  React.useEffect(() => {
    setIsMounted(true);

    // Get referring category from local storage
    const storedCategory = getReferringCategory();
    if (storedCategory) {
      setReferringCategory(storedCategory);
    }

    // Clear referring category when navigating away from product pages
    const isProductPage =
      location.pathname.startsWith('/products/') && !location.pathname.includes('/category/');

    if (!isProductPage) {
      clearReferringCategory();
    }
  }, [location.pathname]);

  // Process path segments after hooks have been called
  const pathSegments = location?.pathname ? location.pathname.split('/').filter(Boolean) : [];
  // console.log('pathSegments', pathSegments);
  // console.log('Matches:', matches);

  // Try to find the current category or product from route data
  let currentCategory: Category | null = null;
  let currentProduct: { name: string; slug: string } | null = null;

  // Ensure matches is iterable before attempting to loop
  if (Array.isArray(matches)) {
    for (const match of matches) {
      const data = match.data as {
        currentCategory?: Category;
        currentProduct?: { name: string; slug: string };
      };

      if (data && data.currentCategory) {
        currentCategory = data.currentCategory;
        console.log('Found currentCategory in route data:', currentCategory);
        break;
      }

      if (data && data.currentProduct) {
        currentProduct = data.currentProduct;
        // console.log('Found currentProduct in route data:', currentProduct);
        break;
      }
    }
  }

  // Skip rendering breadcrumbs on the homepage
  if (pathSegments.length === 0 || location?.pathname === '/') {
    return null;
  }

  // Generate breadcrumbs based on URL path
  const generateBreadcrumbs = () => {
    const breadcrumbs = [{ name: 'Home', path: '/' }];
    // console.log('Generating breadcrumbs for path segments:', pathSegments);

    // If on a direct product page (products/[slug])
    if (
      pathSegments[0] === 'products' &&
      pathSegments.length === 2 &&
      pathSegments[1] !== 'category'
    ) {
      breadcrumbs.push({ name: 'Products', path: '/products' });

      // If we have a referring category, add it to the breadcrumb
      if (referringCategory) {
        // For direct category
        if (!referringCategory.path) {
          breadcrumbs.push({
            name: referringCategory.name,
            path: `/products/category/${referringCategory.slug}`,
          });
        }
        // For nested categories, we need to add each level
        else if (referringCategory.path) {
          const categorySlug = referringCategory.slug;
          // Get the full path of slugs for this category
          const slugPath = getCategoryPath(categorySlug);

          // For each slug in the path, add a breadcrumb item
          for (let i = 0; i < slugPath.length; i++) {
            const slug = slugPath[i];
            const categoryForSlug = findCategoryBySlug(slug);

            if (categoryForSlug) {
              // Build up the path for this level
              const path = `/products/category/${slugPath.slice(0, i + 1).join('/')}`;
              breadcrumbs.push({ name: categoryForSlug.name, path });
            }
          }
        }
      }

      // Use current product data if available
      if (currentProduct) {
        breadcrumbs.push({
          name: currentProduct.name,
          path: `/products/${currentProduct.slug}`,
        });
      } else {
        // Fallback to slug formatting if product data not available
        const productSlug = pathSegments[1];
        const productName = productSlug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        breadcrumbs.push({
          name: productName,
          path: `/products/${productSlug}`,
        });
      }
    }
    // If on a product category page
    else if (pathSegments[0] === 'products' && pathSegments[1] === 'category') {
      breadcrumbs.push({ name: 'Products', path: '/products' });

      // If we have a current category from route data, use it
      if (currentCategory) {
        console.log('Using currentCategory from route data:', currentCategory);
        breadcrumbs.push({
          name: currentCategory.name,
          path: `/products/category/${currentCategory.slug}`,
        });
      }
      // If we have at least one category slug, generate proper category hierarchy
      else if (pathSegments.length >= 3) {
        const categorySlug = pathSegments[pathSegments.length - 1]; // Get the last segment as the current category
        // console.log('Looking for category by slug:', categorySlug);
        const category = findCategoryBySlug(categorySlug);
        // console.log('Found category:', category);

        if (category) {
          // Get the full path of slugs for this category
          const slugPath = getCategoryPath(categorySlug);
          // console.log('Category slug path:', slugPath);

          // For each slug in the path, add a breadcrumb item
          for (let i = 0; i < slugPath.length; i++) {
            const slug = slugPath[i];
            const currentCategory = findCategoryBySlug(slug);
            // console.log('Found category for slug', slug, ':', currentCategory?.name);

            if (currentCategory) {
              // Build up the path for this level
              const path = `/products/category/${slugPath.slice(0, i + 1).join('/')}`;
              breadcrumbs.push({ name: currentCategory.name, path });
              // console.log('Added breadcrumb:', currentCategory.name, path);
            }
          }
        } else {
          console.log('No category found for slug:', categorySlug);
          // Fall back to just showing the slug if we can't find the category
          const displayName = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
          breadcrumbs.push({
            name: displayName.replace(/-/g, ' '),
            path: `/products/category/${categorySlug}`,
          });
          console.log('Added fallback breadcrumb:', displayName);
        }
      }
    }
    // If on a products page
    else if (pathSegments[0] === 'products') {
      breadcrumbs.push({ name: 'Products', path: '/products' });

      // If there's a category filter in the URL
      const url = new URL(
        (location?.pathname || '') + (location?.search || ''),
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
      );
      const categoryId = url.searchParams.get('categoryId');

      if (categoryId) {
        // Find the category with this ID
        const findCategoryById = (cats: Category[]): Category | null => {
          for (const cat of cats) {
            if (cat.id === categoryId) return cat;

            if (cat.children?.length) {
              const found = findCategoryById(cat.children);
              if (found) return found;
            }
          }
          return null;
        };

        const category = findCategoryById(categories);
        if (category) {
          breadcrumbs.push({ name: category.name, path: `/products/category/${category.slug}` });
        }
      }
    }
    // For other pages, just use the page name
    else {
      // Capitalize the first letter of the page name
      const pageName = pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1);
      breadcrumbs.push({ name: pageName, path: `/${pathSegments[0]}` });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Skip rendering if only homepage is in the breadcrumbs
  if (breadcrumbs.length <= 1) return null;

  return (
    <Breadcrumb className={`py-4 ${className}`}>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            {index > 0 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
              ) : isMounted ? (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path}>{crumb.name}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbLink href={crumb.path}>{crumb.name}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default CategoryBreadcrumbs;
