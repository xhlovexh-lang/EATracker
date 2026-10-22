import { STATUS_META, type GameStatusType } from "../config/status";

export function StatusBadge({
  status,
  size = "md",
  label,
}: {
  status: GameStatusType;
  size?: "sm" | "md" | "lg";
  /** Optional visible label override (e.g. fairer “not abandoned” wording). */
  label?: string;
}) {
  const meta = STATUS_META[status];
  const sizeClasses =
    size === "lg"
      ? "px-3.5 py-1.5 text-sm font-semibold"
      : size === "sm"
        ? "px-2 py-0.5 text-xs font-medium"
        : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} ${sizeClasses}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dotColor}`} />
      {label ?? meta.label}
    </span>
  );
}
