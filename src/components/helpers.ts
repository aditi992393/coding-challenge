import type { KeyboardEvent } from 'react';
import type { City } from '@/types';

/**
 * Pure helper functions used by feature components in this folder.
 * Keeping them out of the .tsx files keeps the components focused on JSX.
 */

/** Format a city as "London, England, United Kingdom". */
export function formatCityLabel(city: City): string {
  return `${city.name}${city.admin1 ? ', ' + city.admin1 : ''}, ${city.country}`;
}

/** Format an ISO date string as "Fri, May 30" using the user's locale. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

interface KeyDownArgs {
  cities: City[];
  highlight: number;
  setHighlight: (updater: (prev: number) => number) => void;
  setIsOpen: (open: boolean) => void;
  onSelect: (city: City) => void;
}

/**
 * Keyboard handler for the combobox input. Implements the WAI-ARIA 1.2
 * pattern: Arrow Up/Down to navigate options, Enter to select, Escape to close.
 */
export function handleComboboxKeyDown(e: KeyboardEvent<HTMLInputElement>, args: KeyDownArgs): void {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    args.setIsOpen(true);
    args.setHighlight((h) => Math.min(args.cities.length - 1, h + 1));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    args.setHighlight((h) => Math.max(0, h - 1));
  } else if (e.key === 'Enter') {
    if (args.cities[args.highlight]) {
      e.preventDefault();
      args.onSelect(args.cities[args.highlight]);
    }
  } else if (e.key === 'Escape') {
    args.setIsOpen(false);
  }
}
