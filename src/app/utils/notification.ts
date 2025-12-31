import { MatrixEvent, MsgType } from 'matrix-js-sdk';
import { MessageEvent } from '../../types/matrix/room';

const MAX_BODY_LENGTH = 100;

/**
 * Extracts a user-friendly notification body from a MatrixEvent.
 * For text messages, returns an excerpt of the message body.
 * For other message types (images, videos, etc.), returns a descriptive label.
 *
 * @param mEvent - The Matrix event to extract notification text from
 * @returns A string suitable for display in a notification, or null if the event type is not supported
 */
export function getNotificationBody(mEvent: MatrixEvent): string | null {
  const eventType = mEvent.getType();

  // Handle sticker events
  if (eventType === MessageEvent.Sticker) {
    return 'Sticker';
  }

  // Handle encrypted messages that haven't been decrypted yet
  if (eventType === MessageEvent.RoomMessageEncrypted) {
    return null;
  }

  // Handle regular room messages
  if (eventType === MessageEvent.RoomMessage) {
    const content = mEvent.getContent();
    const msgtype = content.msgtype;

    // Handle different message types
    switch (msgtype) {
      case MsgType.Text:
      case MsgType.Notice:
        return truncateText(content.body || '', MAX_BODY_LENGTH);

      case MsgType.Emote:
        return truncateText(content.body || '', MAX_BODY_LENGTH);

      case MsgType.Image:
        return 'Image';

      case MsgType.Video:
        return 'Video';

      case MsgType.Audio:
        return 'Audio';

      case MsgType.File:
        return 'File';

      case MsgType.Location:
        return 'Location';

      default:
        // For unknown message types, try to use the body if available
        if (content.body) {
          return truncateText(content.body, MAX_BODY_LENGTH);
        }
        return 'Message';
    }
  }

  // Unsupported event type
  return null;
}

/**
 * Truncates text to a maximum length, adding ellipsis if needed.
 * Also removes line breaks and excessive whitespace.
 *
 * @param text - The text to truncate
 * @param maxLength - The maximum length before truncation
 * @returns The truncated text
 */
function truncateText(text: string, maxLength: number): string {
  // Replace line breaks with spaces and collapse multiple spaces
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.substring(0, maxLength) + '...';
}
