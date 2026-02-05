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
      expand={true}
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-2 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:py-4 group-[.toaster]:px-5 group-[.toaster]:min-w-[350px]",
          title: "group-[.toast]:font-bold group-[.toast]:text-base",
          description: "group-[.toast]:text-gray-600 group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-[#8ABD41] group-[.toast]:text-white group-[.toast]:font-semibold",
          cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600",
          closeButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600 group-[.toast]:border-gray-300",
          success: "group-[.toaster]:!bg-emerald-50 group-[.toaster]:!text-emerald-800 group-[.toaster]:!border-emerald-400 group-[.toaster]:!border-2",
          error: "group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-800 group-[.toaster]:!border-red-400 group-[.toaster]:!border-2",
          warning: "group-[.toaster]:!bg-amber-50 group-[.toaster]:!text-amber-800 group-[.toaster]:!border-amber-400 group-[.toaster]:!border-2",
          info: "group-[.toaster]:!bg-blue-50 group-[.toaster]:!text-blue-800 group-[.toaster]:!border-blue-400 group-[.toaster]:!border-2",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

