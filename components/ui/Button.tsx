import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "quest-primary" | "portal-primary" | "secondary" | "reward" | "destructive";
type ButtonSize = "default" | "large";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

// Maps directly to the Buttons component spec (money-quest-design-system.md
// Section 7.6). Quest buttons are larger and use the tactile "resting"
// shadow (Child Area, Principle 4's playful side); Portal buttons are flat
// and compact (Parent/Public restraint).
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  "quest-primary":
    "rounded-lg bg-teal text-white shadow-resting hover:bg-teal/90 active:scale-[0.98] font-medium",
  "portal-primary": "rounded-sm bg-teal text-white hover:bg-teal/90 active:bg-teal/80 font-medium",
  secondary: "rounded-sm border-[1.5px] border-teal text-teal bg-transparent hover:bg-teal/5 font-medium",
  reward: "rounded-lg bg-gold text-ink shadow-resting hover:bg-gold/90 active:scale-[0.98] font-bold",
  destructive: "rounded-sm bg-error text-white hover:bg-error/90 font-medium",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "min-h-touch-min px-sm py-2xs text-base",
  large: "min-h-touch-min-child px-md py-xs text-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "portal-primary", size = "default", isLoading, disabled, className = "", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={[
        "inline-flex items-center justify-center gap-2xs",
        "transition-colors duration-quick ease-out-brand",
        "disabled:opacity-40 disabled:pointer-events-none",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
      {...props}
    >
      {isLoading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
});
