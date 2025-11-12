import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusVariant = "success" | "error" | "warning" | "info" | "pending";

interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
  className?: string;
  showIcon?: boolean;
}

const variantConfig = {
  success: {
    icon: CheckCircle2,
    className: "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20",
  },
  error: {
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
  },
  warning: {
    icon: AlertCircle,
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20",
  },
  info: {
    icon: Info,
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
  },
  pending: {
    icon: Clock,
    className: "bg-muted/50 text-muted-foreground border-muted hover:bg-muted",
  },
};

/**
 * StatusBadge component for displaying status with consistent styling
 * 
 * Variants:
 * - success: ✅ Valid, Completed, Active
 * - error: ❌ Invalid, Failed, Rejected
 * - warning: ⚠️ Expired, Expiring Soon
 * - info: ℹ️ Redeemed, Processing
 * - pending: 🕐 Pending, Waiting
 */
export function StatusBadge({ 
  variant, 
  label, 
  className,
  showIcon = true 
}: StatusBadgeProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1.5 font-medium px-3 py-1 transition-colors",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      <span>{label}</span>
    </Badge>
  );
}
