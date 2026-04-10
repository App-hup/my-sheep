'use client';

import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Animated icon with gradient background circle */}
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 blur-sm scale-125" />
        <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-muted/80 to-muted/40 dark:from-muted/60 dark:to-muted/20 shadow-sm">
          <div className="animate-[gentleBounce_3s_ease-in-out_infinite] text-muted-foreground/70 dark:text-muted-foreground/50 [&>svg]:size-9">
            {icon}
          </div>
        </div>
      </div>

      {/* Prominent title */}
      <h3 className="text-lg font-bold text-foreground mb-1.5">
        {title}
      </h3>

      {/* Subtle description */}
      <p className="max-w-xs text-sm text-muted-foreground leading-relaxed mb-5">
        {description}
      </p>

      {/* Optional action button */}
      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10 dark:border-primary/40 dark:hover:bg-primary/15"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
