import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT =
  process.env.APP_ROOT && process.env.APP_ROOT.length > 0
    ? process.env.APP_ROOT
    : path.join(__dirname, '..');

process.env.APP_ROOT = APP_ROOT;

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

const MAIN_DIST = path.join(APP_ROOT, 'dist-electron');
const RENDERER_DIST = path.join(APP_ROOT, 'dist');

const VITE_PUBLIC =
  process.env.VITE_PUBLIC && process.env.VITE_PUBLIC.length > 0
    ? process.env.VITE_PUBLIC
    : VITE_DEV_SERVER_URL
    ? path.join(APP_ROOT, 'public')
    : RENDERER_DIST;

process.env.VITE_PUBLIC = VITE_PUBLIC;

const isDev = Boolean(VITE_DEV_SERVER_URL);

export function getAppRoot() {
  return APP_ROOT;
}

export { APP_ROOT, MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL, VITE_PUBLIC, isDev };

