import { toast } from "@/components/ui/sonner";

/**
 * Show an Android-style toast chip that appears at the bottom center
 * and automatically dismisses after 1 second
 */
export const showAndroidToast = (message: string) => {
  toast(message, {
    duration: 1000,
  });
};

/**
 * Show a success Android-style toast
 */
export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 1000,
  });
};

/**
 * Show an error Android-style toast  
 */
export const showErrorToast = (message: string) => {
  toast.error(message, {
    duration: 1000,
  });
};