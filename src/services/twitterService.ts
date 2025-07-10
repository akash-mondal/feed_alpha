// ./src/services/twitterService.ts

import API_CONFIG from './config';
import { Tweet, TwitterResponse } from '../types';

export class TwitterService {
  private static instance: TwitterService;

  public static getInstance(): TwitterService {
    if (!TwitterService.instance) {
      TwitterService.instance = new TwitterService();
    }
    return TwitterService.instance;
  }

  /**
   * Fetches a comprehensive timeline for a user, including original tweets, retweets, and replies.
   * It makes two API calls in parallel and combines the results raw.
   */
  async getUserTweets(username: string): Promise<TwitterResponse> {
    try {
      const [mainResponse, repliesResponse] = await Promise.all([
        this._fetchTweets(username, false), // Original tweets and RTs
        this._fetchTweets(username, true),  // Includes replies
      ]);

      // FIX: Combine both arrays directly without de-duplication, as requested.
      const combinedTweets = [...mainResponse.tweets, ...repliesResponse.tweets];

      return {
        tweets: combinedTweets,
        status: 'success',
        has_next_page: mainResponse.has_next_page || repliesResponse.has_next_page,
        next_cursor: mainResponse.next_cursor,
        message: 'Successfully combined raw tweets and replies.',
      };

    } catch (error) {
      console.error('Error fetching comprehensive tweet timeline:', error);
      throw error;
    }
  }

  /**
   * Internal helper function to fetch tweets with a specific `includeReplies` flag.
   * @private
   */
  private async _fetchTweets(username: string, includeReplies: boolean): Promise<TwitterResponse> {
    const url = `${API_CONFIG.twitter.baseUrl}/twitter/user/last_tweets?userName=${username}&includeReplies=${includeReplies}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': API_CONFIG.twitter.key,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error fetching tweets! status: ${response.status}`);
    }

    const data = await response.json();
      
    const transformedResponse: TwitterResponse = {
      tweets: data.data?.tweets?.map((tweet: any) => ({
        id: tweet.id,
        url: tweet.url,
        text: tweet.text,
        source: tweet.source,
        retweetCount: tweet.retweetCount,
        replyCount: tweet.replyCount,
        likeCount: tweet.likeCount,
        quoteCount: tweet.quoteCount,
        viewCount: tweet.viewCount,
        createdAt: tweet.createdAt,
        lang: tweet.lang,
        bookmarkCount: tweet.bookmarkCount,
        isReply: tweet.isReply,
        author: {
          userName: tweet.author.userName,
          name: tweet.author.name,
          profilePicture: tweet.author.profilePicture,
          isBlueVerified: tweet.author.isBlueVerified
        }
      })) || [],
      has_next_page: data.data?.has_next_page || false,
      next_cursor: data.data?.next_cursor || '',
      status: data.status,
      message: data.msg || data.message || ''
    };

    return transformedResponse;
  }
}
