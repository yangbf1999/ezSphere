import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ADDITIVE_PROVIDER_KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type AdditiveProviderKeyError = "duplicate" | "invalid" | null;

export function getAdditiveProviderKeyError(
  key: string,
  existingKeys: readonly string[],
  selfKey?: string,
): AdditiveProviderKeyError {
  const trimmed = key.trim();
  if (!trimmed) return null;
  if (!ADDITIVE_PROVIDER_KEY_PATTERN.test(trimmed)) return "invalid";
  if (selfKey && trimmed === selfKey) return null;
  if (existingKeys.includes(trimmed)) return "duplicate";
  return null;
}

interface AdditiveProviderKeyFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  hint: string;
  lockedHint: string;
  disabled?: boolean;
  isLocked?: boolean;
}

/**
 * OpenCode / OpenClaw / Hermes 模型标识。
 * 下方文案固定为说明（锁定时为锁定提示），错误只在提交时用 toast，
 * 避免点「添加」时 input blur 导致下方突然闪红字。
 */
export function AdditiveProviderKeyField({
  id,
  value,
  onChange,
  label,
  placeholder,
  hint,
  lockedHint,
  disabled = false,
  isLocked = false,
}: AdditiveProviderKeyFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        <span className="text-destructive ml-1">*</span>
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) =>
          onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
        }
        placeholder={placeholder}
        disabled={disabled || isLocked}
      />
      <p className="text-xs text-muted-foreground">
        {isLocked ? lockedHint : hint}
      </p>
    </div>
  );
}
