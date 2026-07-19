import { Switch } from "@/components/ui/switch";

export interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: ToggleRowProps) {
  return (
    <div className="setting-row row">
      <div className="setting-info row-text">
        <div className="setting-row-icon" aria-hidden>
          {icon}
        </div>
        <div>
          <h4 className="rt-title">{title}</h4>
          {description ? <p className="rt-desc">{description}</p> : null}
        </div>
      </div>
      <Switch
        className="switch"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={title}
      />
    </div>
  );
}
