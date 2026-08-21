/**
 * Central configuration constants for FTChat
 */

export const EMAIL_CONFIG = {
  COMPANY_EMAIL: "support@frameworkteam.com",
  DEFAULT_FROM_NAME: "FTChat",
  
  /**
   * Returns the formatted email sender string.
   * Priority:
   * 1. process.env.RESEND_FROM_EMAIL (if specified in environment)
   * 2. "FTChat <support@frameworkteam.com>"
   */
  get FROM_EMAIL(): string {
    if (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.trim() !== "") {
      return process.env.RESEND_FROM_EMAIL.trim();
    }
    return `FTChat <${this.COMPANY_EMAIL}>`;
  },
};
