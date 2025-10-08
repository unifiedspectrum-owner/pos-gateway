/* TypeScript interfaces for communication queue message data structures */

import { EmailParams } from '@shared/types';

/* Email communication queue message */
export interface CommunicationQueueMessage {
  request_id: string;
  params: EmailParams;
};

/* Queue processing result structure */
export interface CommunicationProcessingResult {
  request_id: string;
  success: boolean;
  provider_message_id?: string;
  error?: string;
  timestamp: string;
}
