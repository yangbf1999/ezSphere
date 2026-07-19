import type { RefObject } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageSearchFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  "aria-label"?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
}

/** ezSphere toolbar 搜索框（skills / prompts / mcp.html `.search-field`） */
export function PageSearchField({
  id,
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  inputRef,
  className,
}: PageSearchFieldProps) {
  return (
    <div className={cn("search-field", className)}>
      <Search strokeWidth={2} aria-hidden />
      <input
        ref={inputRef as RefObject<HTMLInputElement>}
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
      />
    </div>
  );
}
