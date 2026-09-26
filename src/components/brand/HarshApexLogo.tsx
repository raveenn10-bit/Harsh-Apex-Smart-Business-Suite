import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface HarshApexLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showBadge?: boolean;
  href?: string;
  theme?: "light" | "dark" | "auto";
  iconOnly?: boolean;
}

export function HarshApexLogo({
  size = "md",
  showText = true,
  showBadge = true,
  href,
  theme = "auto",
  iconOnly = false,
  className,
  ...props
}: HarshApexLogoProps) {
  const sizeConfig = {
    sm: {
      pixelSize: 32,
      titleClass: "text-sm tracking-wider font-extrabold",
      badgeClass: "text-[9px] px-1.5 py-0.5 tracking-widest",
      gap: "gap-2",
    },
    md: {
      pixelSize: 42,
      titleClass: "text-base tracking-wider font-extrabold",
      badgeClass: "text-[10px] px-2 py-0.5 tracking-widest",
      gap: "gap-2.5",
    },
    lg: {
      pixelSize: 52,
      titleClass: "text-xl tracking-wider font-extrabold",
      badgeClass: "text-[11px] px-2.5 py-0.5 tracking-widest",
      gap: "gap-3",
    },
    xl: {
      pixelSize: 68,
      titleClass: "text-2xl tracking-wider font-extrabold",
      badgeClass: "text-xs px-3 py-1 tracking-widest",
      gap: "gap-3.5",
    },
  }[size];

  const content = (
    <div
      className={cn(
        "inline-flex items-center select-none group transition-opacity hover:opacity-95",
        sizeConfig.gap,
        className
      )}
      {...props}
    >
      {/* Official Harsh Apex Digital Solutions Logo */}
      <div className="relative shrink-0 flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="Harsh Apex Digital Solutions"
          width={sizeConfig.pixelSize}
          height={sizeConfig.pixelSize}
          className="rounded-full shadow-xs object-contain transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </div>

      {/* Typography & Subtitle Badge */}
      {!iconOnly && showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "tracking-tight font-black uppercase text-slate-900 dark:text-white font-sans",
                sizeConfig.titleClass,
                theme === "dark" && "text-white",
                theme === "light" && "text-slate-900"
              )}
            >
              HARSH{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                APEX
              </span>
            </span>
          </div>

          {showBadge && (
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={cn(
                  "font-bold uppercase rounded-md bg-gradient-to-r from-blue-600/10 via-blue-700/10 to-indigo-800/10 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 dark:border dark:border-blue-800/60 border border-blue-200/60 shadow-xs",
                  sizeConfig.badgeClass
                )}
              >
                SMART BUSINESS SUITE
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
