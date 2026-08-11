import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const projectRoot = path.resolve(backendDir, '..');

const envPaths = [
  path.join(backendDir, '.env'),
  path.join(projectRoot, '.env'),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}
