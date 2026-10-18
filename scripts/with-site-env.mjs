import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { spawn } from 'node:child_process';

// Operator-only script, never imported by the website or bundled into browsers.
const [file, command, ...args] = process.argv.slice(2);
if (!file || !command) throw new Error('Usage: node scripts/with-site-env.mjs /etc/jhb/site.env <command> [arguments]');
const env = { ...process.env, ...parseEnv(readFileSync(file, 'utf8')) };
const child = spawn(command, args, { env, stdio: 'inherit', shell: false });
child.on('error', () => { console.error('Could not start the requested command'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });