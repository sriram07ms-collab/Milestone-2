import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import PulseDetailClient from './client';

// Generate static params at build time (required for static export)
export async function generateStaticParams() {
  const pulseDir = join(process.cwd(), 'public/data/processed/weekly_pulse');
  
  try {
    // Try manifest first
    const manifestPath = join(pulseDir, 'manifest.json');
    if (existsSync(manifestPath)) {
      // Strip BOM if present (some editors add BOM to UTF-8 files)
      let content = readFileSync(manifestPath, 'utf-8');
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      const manifest = JSON.parse(content);
      if (manifest.files && manifest.files.length > 0) {
        return manifest.files.map((file: string) => ({
          week: file.replace('pulse_', '').replace('.json', ''),
        }));
      }
    }
    
    // Fallback: read directory directly
    if (existsSync(pulseDir)) {
      const files = readdirSync(pulseDir)
        .filter(f => f.startsWith('pulse_') && f.endsWith('.json'))
        .map(f => ({
          week: f.replace('pulse_', '').replace('.json', ''),
        }));
      if (files.length > 0) {
        return files;
      }
    }
  } catch (error) {
    console.warn('Could not read pulse files for static params:', error);
  }
  
  // Return at least one param to satisfy Next.js
  return [{ week: '2025-11-24' }];
}

// Handle both Promise and direct params (Next.js 15+ compatibility)
export default async function PulseDetailPage({ 
  params 
}: { 
  params: Promise<{ week: string }> | { week: string } 
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  return <PulseDetailClient week={resolvedParams.week} />;
}
