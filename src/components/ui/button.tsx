import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import type { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("", {
  variants: {
    variant: {
      default: "ez-btn ez-btn--primary",
      destructive: "ez-btn ez-btn--danger-solid",
      outline: "ez-btn ez-btn--outline",
      secondary: "ez-btn ez-btn--secondary",
      ghost: "ez-btn ez-btn--ghost",
      /** ezSphere 页面 toolbar（design-components `.btn`） */
      btn: "btn",
      "btn-primary": "btn btn-primary",
      "btn-danger": "btn btn-danger",
      /** 模型卡片 foot（models-page `.mini-btn`） */
      mini: "mini-btn",
      "mini-danger": "mini-btn del",
      /** 模型目录添加（models-page `.dir-add`） */
      "dir-add": "dir-add",
      /** 页面内图标按钮（`.icon-btn`） */
      "icon-shell": "icon-btn",
      /** 提示词列表图标按钮（`.prompt-icon-btn`） */
      "prompt-icon": "prompt-icon-btn",
      "prompt-icon-danger": "prompt-icon-btn del",
      /** 技能发现空状态链接按钮（`.btn-link`） */
      "btn-link": "btn-link",
      /** 仅依赖页面 CSS 类，不附加 ez-btn / .btn 基础样式 */
      native: "",
      mcp: "bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 border-emerald-500",
      link: "h-auto min-h-0 border-transparent bg-transparent p-0 text-[var(--shell-accent)] underline-offset-4 hover:underline hover:bg-transparent",
    },
    size: {
      default: "",
      sm: "",
      lg: "ez-btn--lg",
      icon: "ez-btn--icon",
      compact: "btn-compact",
    },
  },
  compoundVariants: [
    {
      variant: ["default", "destructive", "outline", "secondary", "ghost"],
      size: "sm",
      className: "ez-btn--sm",
    },
    {
      variant: ["btn", "btn-primary", "btn-danger"],
      size: "sm",
      className: "btn-sm",
    },
  ],
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  icon?: LucideIcon;
  /** skills.html 导入已有 — 绿点提示 */
  showDot?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      icon: Icon,
      showDot,
      type = "button",
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          showDot && "btn-import",
          className,
        )}
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      >
        {Icon ? <Icon strokeWidth={2} aria-hidden /> : null}
        {children}
        {showDot ? <span className="import-dot" aria-hidden /> : null}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
