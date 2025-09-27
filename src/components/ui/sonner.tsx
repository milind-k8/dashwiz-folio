import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      duration={1000}
      visibleToasts={1}
      toastOptions={{
        duration: 1000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-foreground group-[.toaster]:text-background group-[.toaster]:border-0 group-[.toaster]:shadow-lg group-[.toaster]:rounded-full group-[.toaster]:px-4 group-[.toaster]:py-2 group-[.toaster]:text-sm group-[.toaster]:font-medium group-[.toaster]:min-h-0 group-[.toaster]:max-w-fit group-[.toaster]:mx-auto",
          description: "group-[.toast]:text-background/80 group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-background/20 group-[.toast]:text-background group-[.toast]:rounded-full group-[.toast]:px-3 group-[.toast]:py-1",
          cancelButton: "group-[.toast]:bg-background/20 group-[.toast]:text-background group-[.toast]:rounded-full group-[.toast]:px-3 group-[.toast]:py-1",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
