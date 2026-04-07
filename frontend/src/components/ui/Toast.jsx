import { Toast as KobalteToast } from "@kobalte/core/toast";
import { createSignal, For } from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "../../lib/utils";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-solid";

const [toasts, setToasts] = createSignal([]);
let toastId = 0;

export function showToast(options) {
  const id = toastId++;
  const toast = {
    id,
    title: options.title,
    description: options.description,
    variant: options.variant || "default",
    duration: options.duration || 5000,
  };

  setToasts((prev) => [...prev, toast]);

  if (toast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, toast.duration);
  }

  return id;
}

export function removeToast(id) {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}

function ToastIcon(props) {
  const icons = {
    default: Info,
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
  };

  const Icon = icons[props.variant] || Info;

  return <Icon size={20} />;
}

export function Toaster() {
  return (
    <KobalteToast.Region>
      <Portal>
        <div class="fixed top-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:bottom-0 sm:right-0 sm:flex-col md:max-w-[420px] gap-2">
          <For each={toasts()}>
            {(toast) => (
              <KobalteToast.Root
                toastId={toast.id}
                class={cn(
                  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--kb-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--kb-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[opened]:animate-in data-[closed]:animate-out data-[swipe=end]:animate-out data-[closed]:fade-out-80 data-[closed]:slide-out-to-right-full data-[opened]:slide-in-from-top-full data-[opened]:sm:slide-in-from-bottom-full",
                  toast.variant === "default" && "border-border bg-background text-foreground",
                  toast.variant === "success" && "border-green-500 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100",
                  toast.variant === "error" && "border-red-500 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100",
                  toast.variant === "warning" && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100"
                )}
              >
                <div class="flex gap-3 flex-1">
                  <div class={cn(
                    "mt-0.5",
                    toast.variant === "success" && "text-green-600 dark:text-green-400",
                    toast.variant === "error" && "text-red-600 dark:text-red-400",
                    toast.variant === "warning" && "text-yellow-600 dark:text-yellow-400",
                    toast.variant === "default" && "text-blue-600 dark:text-blue-400"
                  )}>
                    <ToastIcon variant={toast.variant} />
                  </div>
                  <div class="flex-1 space-y-1">
                    <KobalteToast.Title class="text-sm font-semibold">
                      {toast.title}
                    </KobalteToast.Title>
                    {toast.description && (
                      <KobalteToast.Description class="text-sm opacity-90">
                        {toast.description}
                      </KobalteToast.Description>
                    )}
                  </div>
                </div>
                <KobalteToast.CloseButton
                  onClick={() => removeToast(toast.id)}
                  class="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <X size={16} />
                </KobalteToast.CloseButton>
              </KobalteToast.Root>
            )}
          </For>
        </div>
      </Portal>
    </KobalteToast.Region>
  );
}
