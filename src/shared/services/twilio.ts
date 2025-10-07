/* Libraries imports */
import { Twilio } from "twilio";

/* Shared module imports */
import { TWILIO_FROM_PHONE_NUMBER } from "@shared/constants";
import { configService } from "@shared/services";
import { SMSParams, SMSResponse } from "@shared/types";
import { getCurrentISOString } from "@shared/utils";

/* Twilio SMS service for sending messages and phone verification */
export class TwilioService {
  private client: Twilio | null = null; /* Lazily initialized Twilio client instance */

  /* Initialize and return Twilio client with credentials */
  private async getClient(): Promise<Twilio> {
    if (!this.client) {
      const { accountSid, authToken } = await configService.getTwilioCredentials();
      this.client = new Twilio(accountSid, authToken);
    }
    return this.client;
  }

  /* Send SMS message to specified phone number */
  async sendSMSOTP(params: SMSParams): Promise<SMSResponse> {
    try {
      const client = await this.getClient();
      const result = await client.messages.create({
        from: TWILIO_FROM_PHONE_NUMBER,
        to: params.to,
        body: params.message,
      });

      return {
        success: true,
        messageSid: result.sid
      };
    } catch (error) {
      /* Log error details for debugging */
      const errorMessage = error instanceof Error ? error.message : 'Failed to send SMS OTP';
      console.error('[TWILIO-SMS] 500: Twilio SMS service error', {
        error: errorMessage,
        timestamp: getCurrentISOString()
      });
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /* Validate phone number format and check if number exists */
  async verifyPhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const lookup = await client.lookups.v2.phoneNumbers(phoneNumber).fetch();
      return !!lookup.phoneNumber;
    } catch (error) {
      /* Log error details for debugging */
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify phone number';
      console.error('[TWILIO-VERIFY] 500: Phone number verification service error', {
        error: errorMessage,
        timestamp: getCurrentISOString()
      });
      return false;
    }
  }

  /* Reset client instance for cleanup */
  public destroy(): void {
    this.client = null;
  }
}

/* Singleton instance for multi-tenant SMS operations */
export const twilioService = new TwilioService();
