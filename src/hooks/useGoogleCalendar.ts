'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO date or datetime
  end: string;
  color?: string;
  isAllDay: boolean;
}

interface GoogleCalendarState {
  isConnected: boolean;
  isLoading: boolean;
  events: GoogleCalendarEvent[];
  error: string | null;
  calendarName: string | null;
}

const STORAGE_KEY = 'vibeflow-gcal-token';

export function useGoogleCalendar() {
  const [state, setState] = useState<GoogleCalendarState>({
    isConnected: false,
    isLoading: false,
    events: [],
    error: null,
    calendarName: null,
  });

  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const gapiLoadedRef = useRef(false);
  const gisLoadedRef = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Load GAPI client
  useEffect(() => {
    if (!clientId) return;

    // Load Google API script
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiLoadedRef.current = true;

        // Check for stored token
        const storedToken = localStorage.getItem(STORAGE_KEY);
        if (storedToken) {
          try {
            const parsed = JSON.parse(storedToken);
            if (parsed.expiry > Date.now()) {
              window.gapi.client.setToken({ access_token: parsed.token });
              accessTokenRef.current = parsed.token;
              setState(s => ({ ...s, isConnected: true }));
              fetchEvents(parsed.token);
            } else {
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      });
    };
    document.head.appendChild(gapiScript);

    // Load Google Identity Services script
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
      gisLoadedRef.current = true;
    };
    document.head.appendChild(gisScript);

    return () => {
      // Cleanup scripts if component unmounts
      if (gapiScript.parentNode) gapiScript.parentNode.removeChild(gapiScript);
      if (gisScript.parentNode) gisScript.parentNode.removeChild(gisScript);
    };
  }, [clientId]);

  const fetchEvents = useCallback(async (token?: string) => {
    const accessToken = token || accessTokenRef.current;
    if (!accessToken || !gapiLoadedRef.current) return;

    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      // Get calendar list to get primary calendar name
      const calListResponse = await window.gapi.client.calendar.calendarList.list();
      const primary = calListResponse.result.items?.find(
        (c: { primary?: boolean }) => c.primary
      );

      // Fetch events for next 30 days
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 86400000);

      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: thirtyDaysLater.toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
        orderBy: 'startTime',
      });

      const googleEvents: GoogleCalendarEvent[] = (response.result.items || []).map(
        (item: {
          id: string;
          summary?: string;
          description?: string;
          start?: { dateTime?: string; date?: string };
          end?: { dateTime?: string; date?: string };
          colorId?: string;
        }) => ({
          id: item.id,
          summary: item.summary || '(No title)',
          description: item.description,
          start: item.start?.dateTime || item.start?.date || '',
          end: item.end?.dateTime || item.end?.date || '',
          isAllDay: !item.start?.dateTime,
        })
      );

      setState(s => ({
        ...s,
        isLoading: false,
        events: googleEvents,
        calendarName: primary?.summary || 'Google Calendar',
      }));
    } catch (err) {
      console.error('Failed to fetch Google Calendar events:', err);
      setState(s => ({
        ...s,
        isLoading: false,
        error: 'Failed to fetch events. Try reconnecting.',
      }));
    }
  }, []);

  const connect = useCallback(() => {
    if (!clientId || !gisLoadedRef.current || !gapiLoadedRef.current) {
      setState(s => ({ ...s, error: 'Google API not loaded yet. Please try again.' }));
      return;
    }

    if (!tokenClientRef.current) {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        ux_mode: 'popup',
        callback: (response: google.accounts.oauth2.TokenResponse) => {
          if (response.error) {
            setState(s => ({ ...s, error: 'Failed to connect. Please try again.' }));
            return;
          }

          accessTokenRef.current = response.access_token;

          // Store token with expiry
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            token: response.access_token,
            expiry: Date.now() + (response.expires_in * 1000),
          }));

          setState(s => ({ ...s, isConnected: true, error: null }));
          fetchEvents(response.access_token);
        },
        error_callback: (error: { type: string; message?: string }) => {
          if (error.type === 'popup_closed') {
            return; // User closed the popup, not an error
          }
          if (error.type === 'popup_failed_to_open') {
            setState(s => ({
              ...s,
              error: 'Popup was blocked. Please allow popups for this site and try again.',
            }));
            return;
          }
          // redirect_uri_mismatch and other origin errors surface here
          setState(s => ({
            ...s,
            error: `Google sign-in failed: ${error.type}. Make sure "${window.location.origin}" is added as an Authorized JavaScript Origin in your Google Cloud Console OAuth client settings.`,
          }));
        },
      });
    }

    tokenClientRef.current.requestAccessToken({ prompt: '' });
  }, [clientId, fetchEvents]);

  const disconnect = useCallback(() => {
    const token = accessTokenRef.current;
    if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token, () => {});
    }

    accessTokenRef.current = null;
    localStorage.removeItem(STORAGE_KEY);

    if (window.gapi?.client) {
      window.gapi.client.setToken(null);
    }

    setState({
      isConnected: false,
      isLoading: false,
      events: [],
      error: null,
      calendarName: null,
    });
  }, []);

  const refresh = useCallback(() => {
    if (state.isConnected) {
      fetchEvents();
    }
  }, [state.isConnected, fetchEvents]);

  return {
    ...state,
    hasClientId: !!clientId,
    connect,
    disconnect,
    refresh,
  };
}

// Type declarations for Google APIs
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: { discoveryDocs: string[] }) => Promise<void>;
        setToken: (token: { access_token: string } | null) => void;
        calendar: {
          calendarList: {
            list: () => Promise<{
              result: {
                items?: Array<{ primary?: boolean; summary?: string }>;
              };
            }>;
          };
          events: {
            list: (params: {
              calendarId: string;
              timeMin: string;
              timeMax: string;
              showDeleted: boolean;
              singleEvents: boolean;
              maxResults: number;
              orderBy: string;
            }) => Promise<{
              result: {
                items?: Array<{
                  id: string;
                  summary?: string;
                  description?: string;
                  start?: { dateTime?: string; date?: string };
                  end?: { dateTime?: string; date?: string };
                  colorId?: string;
                }>;
              };
            }>;
          };
        };
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: google.accounts.oauth2.TokenResponse) => void;
            error_callback?: (error: { type: string; message?: string }) => void;
            ux_mode?: 'popup' | 'redirect';
            redirect_uri?: string;
          }) => google.accounts.oauth2.TokenClient;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }

  namespace google.accounts.oauth2 {
    interface TokenResponse {
      access_token: string;
      expires_in: number;
      error?: string;
    }
    interface TokenClient {
      requestAccessToken: (config: { prompt: string }) => void;
    }
  }
}
