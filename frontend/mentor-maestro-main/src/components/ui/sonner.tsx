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
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border group-[.toaster]:border-gray-200 group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-gray-600",
          actionButton: "group-[.toast]:bg-[#8ABD41] group-[.toast]:text-white group-[.toast]:font-semibold",
          cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600",
          success: "group-[.toaster]:!bg-[#8ABD41]/10 group-[.toaster]:!text-[#5a7d2a] group-[.toaster]:!border-[#8ABD41]/30",
          error: "group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-700 group-[.toaster]:!border-red-200",
          warning: "group-[.toaster]:!bg-yellow-50 group-[.toaster]:!text-yellow-700 group-[.toaster]:!border-yellow-200",
          info: "group-[.toaster]:!bg-blue-50 group-[.toaster]:!text-blue-700 group-[.toaster]:!border-blue-200",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
