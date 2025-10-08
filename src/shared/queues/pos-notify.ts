/* Shared module imports */
import { getCurrentISOString } from '@shared/utils/time';
import { CommunicationQueueMessage, CommunicationProcessingResult } from '@shared/types';
import { sendGridService } from '@shared/services';

/* Communication queue handler for email messages */
export default {
  async queue(batch: MessageBatch<CommunicationQueueMessage>, _: Env, __: ExecutionContext): Promise<void> {
    console.log('[COMMUNICATION-QUEUE] Processing batch', {
      batch_size: batch.messages.length,
      queue: batch.queue,
      timestamp: getCurrentISOString()
    });

    /* Process all messages in parallel for optimal performance */
    await Promise.all(
      batch.messages.map(async (message) => {
        const communicationMessage = message.body;

        try {
          /* Process the email message */
          await processEmailMessage(communicationMessage);

          /* Acknowledge successful processing */
          message.ack();
        } catch (error) {
          /* Log error details for debugging */
          const errorMessage = error instanceof Error ? error.message : 'Unknown email queue processing error';

          console.error('[EMAIL-QUEUE] Message processing failed', {
            error: errorMessage,
            request_id: communicationMessage.request_id,
            attempts: message.attempts,
            timestamp: getCurrentISOString()
          });

          /* Cloudflare Queues handles retries automatically (max_retries: 3, retry_delay: 30s) */
          /* Ack to prevent further retries after logging failure */
          message.ack();
        }
      })
    );

    console.log('[COMMUNICATION-QUEUE] Batch processing completed', {
      batch_size: batch.messages.length,
      timestamp: getCurrentISOString()
    });
  }
};

/* Process email communication message */
async function processEmailMessage(message: CommunicationQueueMessage): Promise<CommunicationProcessingResult> {
  const result: CommunicationProcessingResult = {
    request_id: message.request_id,
    success: false,
    timestamp: getCurrentISOString()
  };

  try {
    const emailResponse = await sendGridService.sendEmail(message.params);

    if (emailResponse.success) {
      result.success = true;
      result.provider_message_id = emailResponse.messageId;
      result.timestamp = getCurrentISOString();

      console.log('[EMAIL-QUEUE] 200: Email sent successfully', {
        request_id: message.request_id,
        to: message.params.to,
        subject: message.params.subject,
        provider_message_id: emailResponse.messageId,
        timestamp: getCurrentISOString()
      });
    } else {
      result.error = emailResponse.error || 'Email sending failed';

      console.error('[EMAIL-QUEUE] 500: Email sending failed', {
        request_id: message.request_id,
        to: message.params.to,
        error: result.error,
        timestamp: getCurrentISOString()
      });
    }
  } catch (error) {
    /* Log error details for debugging */
    const errorMessage = error instanceof Error ? error.message : 'Unknown email processing error';
    result.error = errorMessage;

    console.error('[EMAIL-QUEUE] 500: Email processing error', {
      error: errorMessage,
      request_id: message.request_id,
      timestamp: getCurrentISOString()
    });
  }

  return result;
}
