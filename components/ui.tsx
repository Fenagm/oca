import React from 'react';

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} data-v0-t="card">
      {children}
    </div>
  );
};
Card.displayName = "Card"

export const CardHeader = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
};
CardHeader.displayName = "CardHeader"

export const CardTitle = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
};
CardTitle.displayName = "CardTitle"

export const CardContent = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
};
CardContent.displayName = "CardContent"

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button"
