
import React from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  className?: string;
  children: React.ReactNode;
}

export function BentoGrid({ className, children }: BentoGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4", 
      className
    )}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  className?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
  onClick?: () => void;
}

export function BentoCard({ 
  className, 
  title, 
  description, 
  icon,
  size = "md",
  children,
  onClick
}: BentoCardProps) {
  const sizeClasses = {
    sm: "col-span-1 row-span-1",
    md: "col-span-1 md:col-span-1 row-span-1",
    lg: "col-span-1 md:col-span-2 row-span-1 md:row-span-2",
  };
  
  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg dark:bg-iot-dark dark:hover:shadow-slate-700/20",
        sizeClasses[size],
        onClick ? "cursor-pointer" : "",
        className
      )}
      onClick={onClick}
    >
      <div className="p-4 sm:p-5 flex flex-col h-full">
        {/* Card Header */}
        {(title || icon) && (
          <div className="flex items-center justify-between mb-3">
            {title && <h3 className="font-medium text-slate-700 dark:text-slate-300">{title}</h3>}
            {icon && <div className="text-iot-blue">{icon}</div>}
          </div>
        )}
        
        {/* Description */}
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{description}</p>
        )}
        
        {/* Card Content */}
        <div className="flex-grow">{children}</div>
      </div>
    </div>
  );
}
