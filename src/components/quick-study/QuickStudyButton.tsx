'use client';

import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import Link from 'next/link';

interface QuickStudyButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  text?: string;
  courseId?: string; // Pre-select course if provided
}

export function QuickStudyButton({ 
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  text = 'Quick Study',
  courseId
}: QuickStudyButtonProps) {
  const href = courseId ? `/quick-study?courseId=${courseId}` : '/quick-study';
  
  return (
    <Link href={href}>
      <Button variant={variant} size={size} className={className}>
        {showIcon && <Zap className="mr-2 h-4 w-4" />}
        {text}
      </Button>
    </Link>
  );
}

// Floating Quick Study Button (can be placed anywhere)
export function QuickStudyFloatingButton({ courseId }: { courseId?: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link href={courseId ? `/quick-study?courseId=${courseId}` : '/quick-study'}>
        <Button 
          size="lg" 
          className="rounded-full shadow-lg hover:shadow-xl transition-all group"
        >
          <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
          Quick Study
        </Button>
      </Link>
    </div>
  );
}

// Inline Quick Study CTA (for course pages)
export function QuickStudyCTA({ 
  title = "Stuck on something?",
  description = "Get instant help with Quick Study",
  courseId 
}: { 
  title?: string;
  description?: string;
  courseId?: string;
}) {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <QuickStudyButton 
        size="sm" 
        courseId={courseId}
      />
    </div>
  );
}
