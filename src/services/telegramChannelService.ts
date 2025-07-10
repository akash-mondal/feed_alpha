// ./src/services/telegramChannelService.ts

import { TelegramResponse, TelegramMessage } from '../types';
import API_CONFIG from './config';

export class TelegramChannelService {
  private static instance: TelegramChannelService;
  private static readonly BASE_URL = API_CONFIG.telegram.baseUrl;

  public static getInstance(): TelegramChannelService {
    if (!TelegramChannelService.instance) {
      TelegramChannelService.instance = new TelegramChannelService();
    }
    return TelegramChannelService.instance;
  }

  async joinPrivateChannel(inviteLink: string): Promise<TelegramResponse> {
    try {
      // --- THIS IS THE FIX ---
      // Get the last part of the URL and remove the leading '+' sign if it exists.
      const rawHash = inviteLink.split('/').pop();
      const hash = rawHash ? rawHash.replace('+', '') : '';

      if (!hash) {
        throw new Error('Invalid invite link format');
      }

      const response = await fetch(`${TelegramChannelService.BASE_URL}/join/${hash}`);
      
      const data: TelegramResponse = await response.json();

      if (!response.ok || data.status !== 'success') {
        // Use the detail message from the API if available, otherwise use a generic message.
        const errorDetail = (data as any).detail || 'The invite link has expired or been revoked.';
        throw new Error(errorDetail);
      }

      return data;
    } catch (error) {
      console.error('Error joining private Telegram channel:', error);
      // Re-throw the error so the UI can catch it and display the message.
      throw error;
    }
  }

  async checkChannel(channelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${TelegramChannelService.BASE_URL}/check/${channelName}`);
      
      if (!response.ok) {
        return false;
      }

      const data: TelegramResponse = await response.json();
      return data.valid_and_joinable || false;
    } catch (error) {
      console.error('Error checking Telegram channel:', error);
      return false;
    }
  }

  async getChannelMessages(channelIdentifier: string | number): Promise<TelegramMessage[]> {
    try {
      const response = await fetch(`${TelegramChannelService.BASE_URL}/scrape/${channelIdentifier}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        return data as TelegramMessage[];
      } else if (data.message && data.message.includes('No activity')) {
        return [];
      } else {
        console.warn('Received non-array response from scrape endpoint:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching Telegram messages:', error);
      throw error;
    }
  }
}
