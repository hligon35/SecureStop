import { create } from 'zustand';

export type TimeOfDayBucket = 'all' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'overnight';

export type ScansFilterState = {
  year: number | null;
  month: number | null; // 1-12
  day: number | null; // 1-31
  timeOfDay: TimeOfDayBucket;

  setFilters: (next: Partial<Pick<ScansFilterState, 'year' | 'month' | 'day' | 'timeOfDay'>>) => void;
  reset: () => void;
};

export const useScansFilterStore = create<ScansFilterState>((set) => ({
  year: null,
  month: null,
  day: null,
  timeOfDay: 'all',

  setFilters: (next) => set(next),
  reset: () =>
    set({
      year: null,
      month: null,
      day: null,
      timeOfDay: 'all',
    }),
}));
