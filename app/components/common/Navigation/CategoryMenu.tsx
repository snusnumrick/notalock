import React from 'react';
import { Link } from '@remix-run/react';
import type { Category } from '~/features/categories/types/category.types';

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  children?: SubCategory[];
}

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '~/components/ui/navigation-menu';

interface CategoryMenuProps {
  categories?: Category[];
  className?: string;
}

const CategoryMenu: React.FC<CategoryMenuProps> = ({ categories = [], className = '' }) => {
  // Handle undefined categories with default empty array
  const safeCategories = Array.isArray(categories) ? categories : [];

  // Filter to only show root categories (those without a parent)
  const rootCategories = safeCategories.filter(cat => cat.parentId === null);
  console.log('rootCategories', rootCategories);

  // Create a lookup map for children
  const childrenMap = safeCategories.reduce(
    (map, category) => {
      if (category.parentId) {
        if (!map[category.parentId]) {
          map[category.parentId] = [];
        }
        map[category.parentId].push(category);
      }
      return map;
    },
    {} as Record<string, Category[]>
  );

  // If no categories are found, show a loading indicator
  if (safeCategories.length === 0 || rootCategories.length === 0) {
    return (
      <div className="flex space-x-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <NavigationMenu className={className}>
      <NavigationMenuList>
        {rootCategories.map(category => (
          <NavigationMenuItem key={category.id}>
            {childrenMap[category.id] && childrenMap[category.id].length > 0 ? (
              <>
                <NavigationMenuTrigger>{category.name}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {childrenMap[category.id].map((subCategory: SubCategory) => (
                      <li key={subCategory.id} className="row-span-1">
                        <NavigationMenuLink asChild>
                          <Link
                            to={`/products/category/${category.slug}/${subCategory.slug}`}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">
                              {subCategory.name}
                            </div>
                            {subCategory.description && (
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {subCategory.description}
                              </p>
                            )}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink asChild>
                <Link
                  to={`/products/category/${category.slug}`}
                  className={navigationMenuTriggerStyle()}
                >
                  {category.name}
                </Link>
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default CategoryMenu;
