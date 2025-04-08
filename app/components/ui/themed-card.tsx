import React from 'react';

interface ThemedCardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export default function ThemedCard({ title, description, children }: ThemedCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="pt-4">{children}</div>
    </div>
  );
}
