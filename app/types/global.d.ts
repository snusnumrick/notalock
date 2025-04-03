// Global TypeScript declarations

// Extend Window interface to include our custom properties
interface Window {
  /**
   * Flag to indicate an undo operation is in progress.
   * This is used to prevent showing redundant toasts during undo operations.
   */
  __isUndoOperation?: boolean;
}
