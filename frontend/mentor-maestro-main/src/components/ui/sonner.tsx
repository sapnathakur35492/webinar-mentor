import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      offset={80}
      richColors
      expand={false}
      visibleToasts={3}
      gap={12}
      closeButton
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border group-[.toaster]:border-gray-200 group-[.toaster]:shadow-[0_8px_30px_rgb(0,0,0,0.12)] group-[.toaster]:rounded-2xl group-[.toaster]:py-5 group-[.toaster]:px-6 group-[.toaster]:min-w-[380px] transition-all duration-300",
          title: "group-[.toast]:font-bold group-[.toast]:text-base group-[.toast]:tracking-tight",
          description: "group-[.toast]:text-gray-500 group-[.toast]:text-sm group-[.toast]:mt-1",
          actionButton: "group-[.toast]:bg-[#3bba69] group-[.toast]:text-white group-[.toast]:font-semibold",
          cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600",
          closeButton: "group-[.toast]:bg-white group-[.toast]:text-gray-400 group-[.toast]:border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity",
          success: "group-[.toaster]:!bg-emerald-50 group-[.toaster]:!text-emerald-900 group-[.toaster]:!border-emerald-200 group-[.toaster]:!shadow-[0_8px_30px_rgb(16,185,129,0.1)]",
          error: "group-[.toaster]:!bg-rose-50 group-[.toaster]:!text-rose-900 group-[.toaster]:!border-rose-200 group-[.toaster]:!shadow-[0_8px_30px_rgb(244,63,94,0.1)]",
          warning: "group-[.toaster]:!bg-amber-50 group-[.toaster]:!text-amber-900 group-[.toaster]:!border-amber-200",
          info: "group-[.toaster]:!bg-sky-50 group-[.toaster]:!text-sky-900 group-[.toaster]:!border-sky-200 group-[.toaster]:!shadow-[0_8px_30px_rgb(14,165,233,0.1)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

