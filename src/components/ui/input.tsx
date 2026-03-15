import * as React from "react";
import { cn } from "@/src/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full bg-[#F8FAFB] border border-[#EDF2F0] rounded-[16px] px-4 py-3 text-[15px] transition-all placeholder:text-[#2D3436]/35 focus:outline-none focus:ring-2 focus:ring-[#67B88B]/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
