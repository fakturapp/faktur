"use client";

import type { ComponentProps, SVGProps } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronLeft,
  Check,
  X,
  Search,
  Plus,
  Minus,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const LUCIDE_MAP: Record<string, React.ComponentType<SVGProps<SVGSVGElement>>> = {
  "chevron-down": ChevronDown as React.ComponentType<SVGProps<SVGSVGElement>>,
  "chevron-right": ChevronRight as React.ComponentType<SVGProps<SVGSVGElement>>,
  "chevron-up": ChevronUp as React.ComponentType<SVGProps<SVGSVGElement>>,
  "chevron-left": ChevronLeft as React.ComponentType<SVGProps<SVGSVGElement>>,
  "check": Check as React.ComponentType<SVGProps<SVGSVGElement>>,
  "x": X as React.ComponentType<SVGProps<SVGSVGElement>>,
  "search": Search as React.ComponentType<SVGProps<SVGSVGElement>>,
  "plus": Plus as React.ComponentType<SVGProps<SVGSVGElement>>,
  "minus": Minus as React.ComponentType<SVGProps<SVGSVGElement>>,
  "alert-circle": AlertCircle as React.ComponentType<SVGProps<SVGSVGElement>>,
  "info": Info as React.ComponentType<SVGProps<SVGSVGElement>>,
  "alert-triangle": AlertTriangle as React.ComponentType<SVGProps<SVGSVGElement>>,
  "check-circle": CheckCircle as React.ComponentType<SVGProps<SVGSVGElement>>,
};

export interface IconProps extends SVGProps<SVGSVGElement> {
  icon: string;
  className?: string;
}

export function Icon({ icon, className, ...props }: IconProps) {
  const name = icon.replace(/^lucide:/, "");
  const LucideIcon = LUCIDE_MAP[name];

  if (!LucideIcon) {
    return <span className={className ?? "w-5 h-5 shrink-0 inline-block"} aria-hidden="true" />;
  }

  return <LucideIcon className={className ?? "w-5 h-5 shrink-0"} {...props} />;
}
