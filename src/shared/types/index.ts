import type { BaseEvent } from '@features/events/types/event.type';

export interface NavigationItem {
  label: string;
  href: string;
  badge?: string;
}

export interface EventCardProps {
  event: BaseEvent;
}

export interface HeroSectionProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  ctaText?: string;
  ctaHref?: string;
}

export interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}