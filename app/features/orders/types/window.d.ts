// Add global window property for tracking undo operations
interface Window {
  __isUndoOperation?: boolean;
}
