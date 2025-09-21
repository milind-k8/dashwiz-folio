import { supabase } from '@/integrations/supabase/client';

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
  };
}

interface GmailListResponse {
  messages: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
}

export class GmailService {
  private accessToken: string | null = null;

  constructor() {
    this.initializeToken();
  }

  private async initializeToken() {
    const { data: { session } } = await supabase.auth.getSession();
    this.accessToken = session?.provider_token || null;
  }

  private async ensureToken() {
    if (!this.accessToken) {
      await this.initializeToken();
    }
    return this.accessToken;
  }

  async getMessages(maxResults: number = 10): Promise<GmailMessage[]> {
    const token = await this.ensureToken();
    if (!token) {
      throw new Error('No Gmail access token available. Please re-authenticate with Google.');
    }

    try {
      // First, get the list of message IDs
      const listResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!listResponse.ok) {
        throw new Error(`Failed to fetch messages: ${listResponse.statusText}`);
      }

      const listData: GmailListResponse = await listResponse.json();
      
      if (!listData.messages || listData.messages.length === 0) {
        return [];
      }

      // Then fetch full message details for each message
      const messagePromises = listData.messages.map(async (msg) => {
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!messageResponse.ok) {
          console.warn(`Failed to fetch message ${msg.id}: ${messageResponse.statusText}`);
          return null;
        }

        return messageResponse.json();
      });

      const messages = await Promise.all(messagePromises);
      return messages.filter(Boolean) as GmailMessage[];
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw error;
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const token = await this.ensureToken();
    if (!token) {
      throw new Error('No Gmail access token available. Please re-authenticate with Google.');
    }

    const emailContent = [
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');

    const encodedMessage = btoa(emailContent)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: encodedMessage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async getUserProfile() {
    const token = await this.ensureToken();
    if (!token) {
      throw new Error('No Gmail access token available. Please re-authenticate with Google.');
    }

    try {
      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching Gmail profile:', error);
      throw error;
    }
  }

  isGmailAccessAvailable(): boolean {
    return !!this.accessToken;
  }
}

export const gmailService = new GmailService();