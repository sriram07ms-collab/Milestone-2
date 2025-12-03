#!/usr/bin/env python3
"""Generate manifest.json for pulse files."""

import json
import os
from pathlib import Path

def generate_manifest():
    pulse_dir = Path("frontend/public/data/processed/weekly_pulse")
    if not pulse_dir.exists():
        print(f"Pulse directory not found: {pulse_dir}")
        return
    
    pulse_files = sorted([f.name for f in pulse_dir.glob("pulse_*.json")])
    
    manifest = {
        "files": pulse_files
    }
    
    manifest_path = pulse_dir / "manifest.json"
    # Write without BOM (utf-8-sig would add BOM, we want plain utf-8)
    with open(manifest_path, "w", encoding="utf-8", newline="") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"Generated manifest.json with {len(pulse_files)} files")

if __name__ == "__main__":
    generate_manifest()

