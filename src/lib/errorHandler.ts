import { toast } from "@/hooks/use-toast";

interface ErrorHandlerOptions {
    title?: string;
    context?: string;
    showToast?: boolean;
}

export const handleError = (error: unknown, options: ErrorHandlerOptions = {}) => {
    const { title = "An error occurred", context, showToast = true } = options;

    // Extract error message
    let message = "Unknown error";
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === "string") {
        message = error;
    } else if (error && typeof error === "object" && "message" in error) {
        message = String((error as any).message);
    }

    // Log to console with context
    if (context) {
        console.error(`[${context}]`, error);
    } else {
        console.error(error);
    }

    // Show toast
    if (showToast) {
        toast({
            title: title,
            description: message,
            variant: "destructive",
        });
    }

    return message;
};
