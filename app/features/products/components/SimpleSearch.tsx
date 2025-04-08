import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '~/components/ui/input';

interface SimpleSearchProps {
  initialValue?: string;
  onSearch: (term: string) => void;
  placeholder?: string;
}

export default function SimpleSearch({
  initialValue = '',
  onSearch,
  placeholder = 'Search products...',
}: SimpleSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isInitialMount = useRef(true);

  const inputRef = useRef<HTMLInputElement>(null);

  // Only update search term from props on initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      setSearchTerm(initialValue);
      isInitialMount.current = false;
    }
  }, [initialValue]);

  // Restore focus when the page loads if needed
  useEffect(() => {
    const shouldFocus = sessionStorage.getItem('productSearchFocus') === 'true';
    if (shouldFocus && inputRef.current) {
      // Get cursor position from session storage (default to end if not available)
      const cursorPosition = sessionStorage.getItem('searchCursorPosition');

      // Short delay to ensure the UI is fully rendered
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();

          // Set cursor position
          const input = inputRef.current;
          if (cursorPosition === 'end' || !cursorPosition) {
            // If no position stored or explicitly set to end, move cursor to end
            const end = input.value.length;
            input.setSelectionRange(end, end);
          } else {
            // Try to restore the exact position
            const pos = parseInt(cursorPosition, 10);
            // Make sure the position is valid for the current text length
            const safePos = Math.min(pos, input.value.length);
            input.setSelectionRange(safePos, safePos);
          }

          // Clear the flags after focusing
          sessionStorage.removeItem('productSearchFocus');
          sessionStorage.removeItem('searchCursorPosition');
        }
      }, 100);
    }
  }, []);

  // Handle search input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set focus and cursor position flags in session storage
    const currentPosition = e.target.selectionStart;
    sessionStorage.setItem('productSearchFocus', 'true');
    sessionStorage.setItem('searchCursorPosition', currentPosition?.toString() || 'end');

    // Debounce the search callback
    timeoutRef.current = setTimeout(() => {
      onSearch(value);
    }, 800); // Use a longer delay to give time to type
  };

  // Clear button handler
  const handleClear = () => {
    setSearchTerm('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onSearch('');
    // After clearing, refocus the input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleChange}
        className="pl-10 pr-8"
        ref={inputRef}
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-4 w-4" />

      {/* Clear button that appears when there's text */}
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
          aria-label="Clear search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
