import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    zIndex?: "base" | "nested" | "alert" | "top";
  }
>(({ className, zIndex = "base", ...props }, ref) => {
  const overlayZIndexMap = {
    base: "z-40",
    nested: "z-50",
    alert: "z-[60]",
    top: "z-[110]",
  };

  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "ez-modal-overlay fixed inset-0",
        overlayZIndexMap[zIndex],
        className,
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    zIndex?: "base" | "nested" | "alert" | "top";
    variant?: "default" | "fullscreen";
    size?: "default" | "lg" | "sm";
    overlayClassName?: string;
  }
>(
  (
    {
      className,
      children,
      zIndex = "base",
      variant = "default",
      size = "default",
      overlayClassName,
      ...props
    },
    ref,
  ) => {
    const contentZIndexMap = {
      base: "z-50",
      nested: "z-[60]",
      alert: "z-[70]",
      top: "z-[120]",
    };

    const variantClass =
      variant === "fullscreen"
        ? "fixed inset-0 flex flex-col w-screen h-screen bg-background text-foreground p-0 sm:rounded-none shadow-none"
        : "fixed inset-0 grid place-items-center px-4 pb-4 pt-10 pointer-events-none border-0 bg-transparent shadow-none outline-none";

    const innerClass =
      variant === "fullscreen"
        ? null
        : cn(
            "ez-modal-content__inner pointer-events-auto flex w-full max-h-[min(88vh,calc(100vh-56px))] flex-col",
            size === "lg" && "ez-modal-content--lg",
            size === "sm" && "ez-modal-content--sm",
          );

    return (
      <DialogPortal>
        <DialogOverlay zIndex={zIndex} className={overlayClassName} />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(variantClass, contentZIndexMap[zIndex], className)}
          onInteractOutside={(e) => {
            // 防止点击遮罩层关闭对话框
            e.preventDefault();
          }}
          {...props}
        >
          {innerClass ? (
            <div className={innerClass}>{children}</div>
          ) : (
            children
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("ez-modal-head", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogHeaderText = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)}
    {...props}
  />
);
DialogHeaderText.displayName = "DialogHeaderText";

const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("ez-modal-body", className)} {...props} />
);
DialogBody.displayName = "DialogBody";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("ez-modal-foot", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "min-w-0 flex-1 text-[15px] font-semibold leading-tight tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-[11.5px] leading-snug text-[var(--shell-text-secondary)]",
      className,
    )}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogCloseButton = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    className={cn("ez-modal-close", className)}
    {...props}
  >
    {children ?? <X className="h-4 w-4" aria-hidden="true" />}
    <span className="sr-only">Close</span>
  </DialogPrimitive.Close>
));
DialogCloseButton.displayName = "DialogCloseButton";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogHeaderText,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogCloseButton,
};
