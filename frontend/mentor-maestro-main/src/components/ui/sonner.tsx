import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      offset={24}
      richColors
      expand={false}
      visibleToasts={3}
      gap={10}
      closeButton
      toastOptions={{
        duration: 4000,
        style: {
          maxWidth: '420px',
          width: 'auto',
          minWidth: '320px',
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#142721] group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-[#3bba69]/30 group-[.toaster]:shadow-[0_8px_32px_rgba(0,0,0,0.4)] group-[.toaster]:rounded-xl group-[.toaster]:py-3.5 group-[.toaster]:px-5 group-[.toaster]:backdrop-blur-xl transition-all duration-300",
          title: "group-[.toast]:font-bold group-[.toast]:text-[15px] group-[.toast]:tracking-tight group-[.toast]:text-white",
          description: "group-[.toast]:text-white/60 group-[.toast]:text-sm group-[.toast]:mt-1",
          actionButton: "group-[.toast]:bg-[#3bba69] group-[.toast]:text-white group-[.toast]:font-semibold group-[.toast]:rounded-lg",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white/70 group-[.toast]:rounded-lg",
          closeButton: "group-[.toast]:bg-transparent group-[.toast]:text-white/40 group-[.toast]:border-white/10 group-[.toast]:hover:text-white group-[.toast]:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity",
          success: "group-[.toaster]:!bg-[#0d2a1a] group-[.toaster]:!text-emerald-100 group-[.toaster]:!border-emerald-500/40 group-[.toaster]:!shadow-[0_8px_32px_rgba(16,185,129,0.15)]",
          error: "group-[.toaster]:!bg-[#2a0d0d] group-[.toaster]:!text-rose-100 group-[.toaster]:!border-rose-500/40 group-[.toaster]:!shadow-[0_8px_32px_rgba(244,63,94,0.15)]",
          warning: "group-[.toaster]:!bg-[#2a200d] group-[.toaster]:!text-amber-100 group-[.toaster]:!border-amber-500/40 group-[.toaster]:!shadow-[0_8px_32px_rgba(245,158,11,0.15)]",
          info: "group-[.toaster]:!bg-[#0d1f2a] group-[.toaster]:!text-sky-100 group-[.toaster]:!border-sky-500/40 group-[.toaster]:!shadow-[0_8px_32px_rgba(14,165,233,0.15)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };


