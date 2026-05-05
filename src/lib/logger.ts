/**
 * Simple logger utility to replace console.log in production.
 * Controls log visibility based on environment.
 */

const isProd = import.meta.env.PROD;

export const logger = {
  log: (...args: any[]) => {
    if (!isProd) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (!isProd) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // We usually want to see errors even in production, 
    // but maybe through a monitoring service.
    // For now, let's keep them visible in the console.
    console.error(...args);
  },
  info: (...args: any[]) => {
    if (!isProd) {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (!isProd) {
      console.debug(...args);
    }
  }
};
