import { useTheme } from './theme-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Sun, Moon, Laptop, CheckIcon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-md bg-product-card/80 dark:bg-gray-800/50 border border-border flex items-center justify-center transition-colors hover:bg-product-hover dark:hover:bg-gray-700/70"
          aria-label="Change theme"
          title="Change theme"
        >
          {theme === 'light' && <Sun className="h-4 w-4 text-text-primary" />}
          {theme === 'dark' && <Moon className="h-4 w-4 text-text-primary" />}
          {theme === 'system' && <Laptop className="h-4 w-4 text-text-primary" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Sun className="h-4 w-4 mr-2" />
            <span>Light</span>
          </div>
          {theme === 'light' && <CheckIcon className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Moon className="h-4 w-4 mr-2" />
            <span>Dark</span>
          </div>
          {theme === 'dark' && <CheckIcon className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Laptop className="h-4 w-4 mr-2" />
            <span>System</span>
          </div>
          {theme === 'system' && <CheckIcon className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
