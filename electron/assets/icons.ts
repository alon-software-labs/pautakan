import fs from 'node:fs';
import path from 'node:path';
import { RENDERER_DIST, VITE_PUBLIC } from '../main/env';

function firstExisting(paths: string[]): string | undefined {
  for (const candidate of paths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

export function getAppIconPath(): string | undefined {
  const candidates: string[] = [];

  if (process.platform === 'win32') {
    candidates.push(path.join(VITE_PUBLIC, 'icon.ico'));
    candidates.push(path.join(RENDERER_DIST, 'icon.ico'));
  } else if (process.platform === 'darwin') {
    candidates.push(path.join(VITE_PUBLIC, 'icon.icns'));
    candidates.push(path.join(RENDERER_DIST, 'icon.icns'));
  }

  candidates.push(path.join(VITE_PUBLIC, 'CENTER VAULT.png'));
  candidates.push(path.join(RENDERER_DIST, 'CENTER VAULT.png'));

  return firstExisting(candidates);
}

