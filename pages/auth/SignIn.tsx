import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Check, CheckCircle, ExternalLink } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';
import { supabase } from '../../supabaseClient';
import { signInWithGooglePopup } from '../../services/oauthService';
import { DEMO_AUTH_EMAIL, DEMO_AUTH_PASSWORD, useAuth } from '../../context/AuthContext';

export const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInDemo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [popupFallbackUrl, setPopupFallbackUrl] = useState<string | null>(null);

  const successMessage = location.state?.successMessage;
  const prefilledEmail = location.state?.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    setPopupFallbackUrl(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = (formData.get('email') as string) || '';
    const password = (formData.get('password') as string) || '';

    if (email.trim().toLowerCase() === DEMO_AUTH_EMAIL) {
      const demoRes = signInDemo(email, password);
      if (demoRes.ok) {
        setLoading(false);
        navigate(RoutePath.HOME);
        return;
      }
      setAuthError(demoRes.error || 'Invalid email or password.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
      } else {
        navigate(RoutePath.HOME);
      }
    } catch (err) {
      console.error('Login error:', err);
      setAuthError('An unexpected error occurred while signing in.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSignIn = () => {
    setAuthError(null);
    setPopupFallbackUrl(null);
    const res = signInDemo(DEMO_AUTH_EMAIL, DEMO_AUTH_PASSWORD);
    if (res.ok) {
      navigate(RoutePath.HOME);
    } else {
      setAuthError(res.error || 'Demo sign-in failed.');
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
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Publisher Access</p>
            <h1 className="font-display text-3xl font-normal tracking-tight text-white">
              Sign in to Loombook
            </h1>
            <p className="text-sm text-white/60 leading-relaxed">
              Manage your Story Bibles, telemetry streams, and saved editions.
            </p>
          </div>

          {successMessage && (
            <div className="flex w-full items-start gap-3 rounded-xl border border-white/15 bg-[#101014] p-4 text-xs text-white">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-white" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

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
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={prefilledEmail}
              placeholder="name@example.com"
              label="Email"
              icon={Mail}
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              label="Password"
              icon={Lock}
            />

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative flex items-center justify-center w-4 h-4 rounded border border-white/25 bg-black">
                  <input type="checkbox" className="peer absolute inset-0 opacity-0 cursor-pointer" />
                  <Check size={11} className="text-white opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3} />
                </div>
                <span className="text-xs text-white/60">Remember me</span>
              </label>
            </div>

            <Button type="submit" size="lg" className="w-full" isLoading={loading}>
              Sign In
            </Button>
          </form>

          <div className="rounded-xl border border-white/10 bg-[#101014] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/55">Demo Account</span>
              <span className="font-mono-tabular text-white/80">
                {DEMO_AUTH_EMAIL} · {DEMO_AUTH_PASSWORD}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleQuickDemoSignIn}
              disabled={loading}
              className="w-full"
            >
              Sign In as Demo Publisher ({DEMO_AUTH_EMAIL})
            </Button>
          </div>

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
            Don't have an account?{' '}
            <Link to={RoutePath.SIGNUP} className="font-semibold text-white hover:underline">
              Create one
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