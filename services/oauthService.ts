import { supabase } from '../supabaseClient';

export interface OAuthPopupResult {
  ok: boolean;
  error?: string;
  popupUrl?: string;
}

interface OAuthCallbackPayload {
  type: 'SUPABASE_OAUTH_CALLBACK';
  hash?: string;
  search?: string;
}

const OAUTH_STORAGE_KEY = 'loombook_oauth_result';
const OAUTH_CHANNEL_NAME = 'loombook-oauth';

async function applyOAuthParams(hash: string, search: string): Promise<OAuthPopupResult> {
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  const errorCode = hashParams.get('error') || searchParams.get('error');
  const errorDescription =
    hashParams.get('error_description') || searchParams.get('error_description');

  if (errorCode || errorDescription) {
    const raw = (errorDescription || errorCode || 'Google sign-in failed.').replace(/\+/g, ' ');
    if (errorCode === 'access_denied') {
      return {
        ok: false,
        error:
          'Google sign-in was denied (403 / access_denied). Ensure your Google account is authorized in the OAuth consent screen or sign in with email and password.',
      };
    }
    return { ok: false, error: raw };
  }

  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  const code = searchParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  const { data } = await supabase.auth.getSession();
  if (data.session) {
    return { ok: true };
  }

  return { ok: false, error: 'Google sign-in did not return a session.' };
}

export async function signInWithGooglePopup(): Promise<OAuthPopupResult> {
  const redirectTo = `${window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error || !data?.url) {
    return {
      ok: false,
      error: error?.message || 'Unable to start Google OAuth flow.',
    };
  }

  try {
    localStorage.removeItem(OAUTH_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }

  const width = 520;
  const height = 660;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

  const popup = window.open(
    data.url,
    'loombook_google_oauth',
    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,status=no`
  );

  if (!popup) {
    return {
      ok: false,
      error:
        'Your browser blocked the Google sign-in popup. Allow popups for this preview or open Google Sign-In in a new tab below.',
      popupUrl: data.url,
    };
  }

  return new Promise<OAuthPopupResult>((resolve) => {
    let settled = false;
    let channel: BroadcastChannel | null = null;
    let closePollTimer: number | null = null;
    let timeoutTimer: number | null = null;

    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
      if (channel) {
        try {
          channel.close();
        } catch {
          // ignore
        }
      }
      if (closePollTimer !== null) window.clearInterval(closePollTimer);
      if (timeoutTimer !== null) window.clearTimeout(timeoutTimer);
    };

    const finish = (result: OAuthPopupResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const handlePayload = async (payload: OAuthCallbackPayload) => {
      if (payload?.type !== 'SUPABASE_OAUTH_CALLBACK') return;
      const result = await applyOAuthParams(payload.hash || '', payload.search || '');
      finish(result);
    };

    const onMessage = (event: MessageEvent) => {
      const origin = event.origin || '';
      const allowed =
        origin === window.location.origin ||
        origin.endsWith('.run.app') ||
        origin.includes('localhost');
      if (!allowed) return;
      if (event.data?.type === 'SUPABASE_OAUTH_CALLBACK') {
        void handlePayload(event.data as OAuthCallbackPayload);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== OAUTH_STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as OAuthCallbackPayload;
        localStorage.removeItem(OAUTH_STORAGE_KEY);
        void handlePayload(parsed);
      } catch {
        // ignore parse errors
      }
    };

    window.addEventListener('message', onMessage);
    window.addEventListener('storage', onStorage);

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(OAUTH_CHANNEL_NAME);
        channel.onmessage = (event) => {
          if (event.data?.type === 'SUPABASE_OAUTH_CALLBACK') {
            void handlePayload(event.data as OAuthCallbackPayload);
          }
        };
      } catch {
        // ignore if unsupported
      }
    }

    closePollTimer = window.setInterval(() => {
      if (popup.closed) {
        window.setTimeout(async () => {
          if (settled) return;
          try {
            const raw = localStorage.getItem(OAUTH_STORAGE_KEY);
            if (raw) {
              localStorage.removeItem(OAUTH_STORAGE_KEY);
              const parsed = JSON.parse(raw) as OAuthCallbackPayload;
              await handlePayload(parsed);
              return;
            }
          } catch {
            // ignore
          }
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            finish({ ok: true });
          } else {
            finish({
              ok: false,
              error: `Google sign-in did not return to ${redirectTo}. Add "${window.location.origin}/**" to Supabase → Authentication → URL Configuration → Redirect URLs and update Site URL from yellow-sheep-189580.hostingersite.com.`,
            });
          }
        }, 450);
      }
    }, 350);

    timeoutTimer = window.setTimeout(() => {
      finish({
        ok: false,
        error: 'Google sign-in timed out. Please try again.',
      });
    }, 120_000);
  });
}
