import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, Smile, ExternalLink } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';
import { supabase } from '../../supabaseClient';
import { signInWithGooglePopup } from '../../services/oauthService';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [popupFallbackUrl, setPopupFallbackUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    setPopupFallbackUrl(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const fullName = formData.get('fullName') as string;
    const displayName = formData.get('displayName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            display_name: displayName,
          },
        },
      });

      if (error) {
        setAuthError(error.message);
      } else {
        navigate(RoutePath.LOGIN, {
          state: {
            email,
            successMessage:
              'Your account has been created. Please verify your email address before signing in.',
          },
        });
      }
    } catch (err) {
      console.error('Signup error:', err);
      setAuthError('An unexpected error occurred while creating your account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setAuthError(null);
    setPopupFallbackUrl(null);
    try {
      const result = await signInWithGooglePopup();
      if (result.ok) {
        navigate(RoutePath.HOME);
      } else {
        setAuthError(result.error || 'Google sign-in failed.');
        if (result.popupUrl) {
          setPopupFallbackUrl(result.popupUrl);
        }
      }
    } catch (err) {
      console.error('Google login error:', err);
      setAuthError('An unexpected error occurred during Google sign-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col justify-between px-8 py-8">
      <div className="flex items-center justify-between">
        <Link
          to={RoutePath.HOME}
          className="text-lg font-semibold uppercase tracking-[0.15em] text-white"
        >
          Loombook
        </Link>
        <Link
          to={RoutePath.HOME}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Library
        </Link>
      </div>

      <div className="mx-auto w-full max-w-md py-12">
        <div className="rounded-2xl border border-white/10 bg-[#0A0A0D] p-8 sm:p-10 space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">New Publisher</p>
            <h1 className="font-display text-3xl font-normal tracking-tight text-white">
              Create your account
            </h1>
            <p className="text-sm text-white/60 leading-relaxed">
              Publish interactive editions with live Reader-Signal Autopilot telemetry.
            </p>
          </div>

          {authError && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300 space-y-2">
              <p>{authError}</p>
              {popupFallbackUrl && (
                <a
                  href={popupFallbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-white underline"
                >
                  Open Google Sign-In in new tab
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="Jane Doe"
              label="Full Name"
              icon={User}
            />
            <Input
              id="displayName"
              name="displayName"
              type="text"
              required
              placeholder="Jane"
              label="Display Name"
              icon={Smile}
            />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.com"
              label="Email"
              icon={Mail}
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Create a password"
              label="Password"
              icon={Lock}
            />

            <Button type="submit" size="lg" className="w-full mt-2" isLoading={loading}>
              Create Account
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">Or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button
            variant="secondary"
            type="button"
            size="lg"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full gap-2.5"
          >
            <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M12.0003 20.45c-4.6667 0-8.45-3.7833-8.45-8.45 0-4.6667 3.7833-8.45 8.45-8.45 2.1333 0 4.0833.7333 5.6333 1.95L15.4 8.0167c-1.0833-.8667-2.2833-1.3-3.4-1.3-3.05 0-5.5167 2.4667-5.5167 5.2833s2.4667 5.2833 5.5167 5.2833c2.6167 0 4.4333-1.5833 4.8833-4.0833h-4.8833v-2.8h7.95c.1.5167.15 1.05.15 1.6167 0 4.6333-3.1667 8.4333-8.1 8.4333z"
                fill="currentColor"
              />
            </svg>
            <span>Continue with Google</span>
          </Button>

          <p className="text-center text-xs text-white/60 pt-1">
            Already have an account?{' '}
            <Link to={RoutePath.LOGIN} className="font-semibold text-white hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-white/40 uppercase tracking-[0.18em]">
        Loombook · Interactive Press
      </p>
    </div>
  );
};