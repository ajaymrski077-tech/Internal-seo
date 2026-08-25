/**
 * Centralized API Error Handling Utility
 */

export interface ApiErrorOptions {
  toast: {
    error: (msg: string) => void;
  };
  fallbackMessage: string;
}

/**
 * Handles API errors consistently across the application.
 * - Shows an error toast with the provided fallback or the server's error message.
 * - Logs the actual error to the console.
 */
export function handleApiError(err: unknown, options: ApiErrorOptions) {
  console.error("API Error:", err);
  
  const { toast, fallbackMessage } = options;
  
  if (err instanceof Error) {
    toast.error(err.message || fallbackMessage);
  } else if (typeof err === "string") {
    toast.error(err || fallbackMessage);
  } else {
    toast.error(fallbackMessage);
  }
}
