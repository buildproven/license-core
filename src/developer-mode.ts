/**
 * Owner / developer mode — the kit CREATOR runs every pro feature without
 * paying themselves, while CUSTOMERS still hit the full signed-registry check.
 *
 * One implementation so every product (qa-architect, claude-kit-pro, ...) treats
 * the owner identically, parameterised per-product by env-var name and marker
 * path. Extracted from qa-architect's lib/licensing.js isDeveloperMode() so the
 * two products stop drifting (claude-kit-pro had no owner path at all).
 *
 * Security: NODE_ENV=production HARD-disables the bypass, so a customer cannot
 * set the env var or drop a marker file to cheat the gate.
 */

import { existsSync } from 'fs';

export interface DeveloperModeConfig {
  /** Env var that, when "true", enables owner mode. e.g. "QAA_DEVELOPER", "CKIT_DEVELOPER". */
  envVar: string;
  /** Absolute path to the marker file whose existence enables owner mode. */
  markerFile: string;
}

/**
 * Returns true when the current machine is the kit owner's dev environment.
 *
 * Never returns true under NODE_ENV=production. Otherwise true when either the
 * configured env var is "true" OR the marker file exists. An ELOOP (symlink
 * loop) on the marker path throws in production (tamper signal) and is treated
 * as "no marker" elsewhere.
 */
export function isDeveloperMode(config: DeveloperModeConfig): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env[config.envVar] === 'true') return true;
  try {
    if (existsSync(config.markerFile)) return true;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ELOOP' && process.env.NODE_ENV === 'production') {
      throw new Error('Symlink loop detected in license marker path — possible tampering');
    }
    // Any other error (incl. ENOENT) means "no usable marker".
  }
  return false;
}
