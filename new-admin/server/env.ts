// Single place the handlers read configuration and services from.
import { DB } from './db';
import { MEDIA } from './storage';

export const env = {
  DB,
  MEDIA,
  get ADMIN_EMAIL() { return process.env.ADMIN_EMAIL || ''; },
  get ADMIN_BOOTSTRAP_PASSWORD() { return process.env.ADMIN_BOOTSTRAP_PASSWORD || ''; },
  get ADMIN_SESSION_SECRET() { return process.env.ADMIN_SESSION_SECRET || ''; }
};
