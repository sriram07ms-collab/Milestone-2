import type { WeeklyPulseNote, ThemeAggregation } from './types';

// Client-side data fetching functions (for static export)
export async function fetchAllPulses(): Promise<WeeklyPulseNote[]> {
  try {
    const response = await fetch('/data/processed/weekly_pulse/manifest.json');
    if (!response.ok) {
      console.warn('Manifest not found, trying to discover files');
      // Fallback: try common file names
      const commonFiles = [
        'pulse_2025-11-24.json',
        'pulse_2025-11-17.json',
        'pulse_2025-11-10.json',
        'pulse_2025-11-03.json',
        'pulse_2025-10-27.json',
        'pulse_2025-10-20.json',
        'pulse_2025-10-13.json',
        'pulse_2025-09-15.json',
      ];
      const pulses: WeeklyPulseNote[] = [];
      for (const file of commonFiles) {
        try {
          const pulseResponse = await fetch(`/data/processed/weekly_pulse/${file}`);
          if (pulseResponse.ok) {
            pulses.push(await pulseResponse.json());
          }
        } catch (error) {
          // Continue to next file
        }
      }
      return pulses.sort((a, b) => b.week_start.localeCompare(a.week_start));
    }
    
    const manifest = await response.json();
    const pulses: WeeklyPulseNote[] = [];
    
    for (const file of manifest.files || []) {
      try {
        const pulseResponse = await fetch(`/data/processed/weekly_pulse/${file}`);
        if (pulseResponse.ok) {
          pulses.push(await pulseResponse.json());
        }
      } catch (error) {
        console.error(`Error fetching pulse ${file}:`, error);
      }
    }
    
    return pulses.sort((a, b) => b.week_start.localeCompare(a.week_start));
  } catch (error) {
    console.error('Error fetching pulses:', error);
    return [];
  }
}

export async function fetchPulse(weekStart: string): Promise<WeeklyPulseNote | null> {
  try {
    const response = await fetch(`/data/processed/weekly_pulse/pulse_${weekStart}.json`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching pulse:`, error);
    return null;
  }
}

export async function fetchThemeAggregation(): Promise<ThemeAggregation | null> {
  try {
    const response = await fetch('/data/processed/theme_aggregation.json');
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching theme aggregation:`, error);
    return null;
  }
}
