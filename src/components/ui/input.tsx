import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva("ez-input", {
  variants: {
    variant: {
      default: "",
      modal: "ez-input--modal",
      mono: "ez-input--mono",
      "modal-mono": "ez-input--modal ez-input--mono",
    },
    size: {
      default: "",
      sm: "ez-input--sm",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, size, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant, size }),
          type === "number" && variant !== "mono" && variant !== "modal-mono" && "ez-input--mono",
          className,
        )}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
