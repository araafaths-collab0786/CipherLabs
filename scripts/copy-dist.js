import fs from 'fs';

if (fs.existsSync('dist')) {
  fs.cpSync('dist', 'build', { recursive: true });
}
