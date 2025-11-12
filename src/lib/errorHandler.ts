import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";

export interface AppError {
  message: string;
  code?: string;
  details?: string;
}

export function handleError(error: unknown, fallbackMessage = "An error occurred"): AppError {
  console.error("Error:", error);

  // Handle Supabase errors
  if (error && typeof error === "object" && "code" in error) {
    const pgError = error as PostgrestError;
    return {
      message: pgError.message || fallbackMessage,
      code: pgError.code,
      details: pgError.details,
    };
  }

  // Handle auth errors
  if (error && typeof error === "object" && "message" in error) {
    const authError = error as { message: string };
    return {
      message: authError.message || fallbackMessage,
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage,
    };
  }

  // Unknown error type
  return {
    message: fallbackMessage,
  };
}

export function showErrorToast(error: unknown, fallbackMessage = "An error occurred") {
  const appError = handleError(error, fallbackMessage);
  toast.error(appError.message);
  return appError;
}

export function showSuccessToast(message: string) {
  toast.success(message);
}
