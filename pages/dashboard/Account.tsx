import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Save, Camera, Key, Globe, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../supabaseClient';
import { RoutePath } from '../../types';
import { storageService } from '../../services/storageService';
import { StorageImage } from '../../components/ui/StorageImage';
import { useAuth } from '../../context/AuthContext';

export const Account: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, isDemoUser, updateDemoProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    timezone: 'UTC-8 (Pacific Time)',
  });
  const [avatarPath, setAvatarPath] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (isDemoUser && authUser) {
          setUserId(authUser.id);
          setEmail(authUser.email);
          setAvatarPath(authUser.avatarUrl || null);
          const stored = authUser as { displayName?: string; timezone?: string };
          setFormData({
            fullName: authUser.name || 'Demo Publisher',
            displayName: stored.displayName || 'Publisher',
            timezone: stored.timezone || 'UTC-8 (Pacific Time)',
          });
          setFetching(false);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate(RoutePath.LOGIN);
          return;
        }

        setUserId(user.id);
        setEmail(user.email || '');
        setAvatarPath(user.user_metadata?.avatar_url || null);

        setFormData({
          fullName: user.user_metadata?.full_name || '',
          displayName: user.user_metadata?.display_name || '',
          timezone: user.user_metadata?.timezone || 'UTC-8 (Pacific Time)',
        });
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setFetching(false);
      }
    };

    void fetchUser();
  }, [navigate, isDemoUser, authUser]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userId) {
      if (isDemoUser) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : null;
          if (dataUrl) {
            setAvatarPath(dataUrl);
            updateDemoProfile({ avatarUrl: dataUrl });
            setNotice('Demo profile avatar updated.');
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      try {
        setLoading(true);
        const extension = file.name.split('.').pop();
        const path = await storageService.uploadFile(file, userId, 'avatar', `profile.${extension}`);
        setAvatarPath(path);

        const { error } = await supabase.auth.updateUser({
          data: { avatar_url: path },
        });
        if (error) throw error;
        setNotice('Profile avatar updated.');
      } catch (error) {
        console.error('Error uploading avatar:', error);
        setNotice('Failed to upload avatar.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    if (isDemoUser) {
      updateDemoProfile({
        fullName: formData.fullName,
        displayName: formData.displayName,
        timezone: formData.timezone,
      });
      setLoading(false);
      setNotice('Demo profile changes saved.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          display_name: formData.displayName,
          timezone: formData.timezone,
        },
      });

      if (error) throw error;
      setNotice('Profile changes saved.');
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotice('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (isDemoUser) {
      setNotice('Demo account password is fixed to 12345678.');
      return;
    }
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/account',
    });
    if (error) setNotice(error.message);
    else setNotice('Password reset instructions sent to your email.');
  };

  const handleSignOut = async () => {
    await logout();
    navigate(RoutePath.LOGIN);
  };

  if (fetching) {
    return (
      <div className="mx-auto max-w-4xl px-8 py-20 text-sm text-white/60">
        Loading publisher account...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-12 space-y-8 bg-black text-white">
      <div className="border-b border-white/10 pb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-white/45">Publisher Settings</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-normal tracking-tight text-white">
          {formData.fullName || formData.displayName || email.split('@')[0] || 'Account'}
        </h1>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-white/60">
          <Mail size={14} />
          {email}
        </p>
      </div>

      {notice && (
        <div className="rounded-xl border border-white/15 bg-[#101014] px-4 py-3 text-sm text-white">
          {notice}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#0A0A0D] divide-y divide-white/10 overflow-hidden">
        {/* Avatar */}
        <div className="p-8 flex flex-col sm:flex-row sm:items-center gap-6">
          <div
            className="group relative h-24 w-24 shrink-0 cursor-pointer"
            onClick={() => document.getElementById('avatar-upload')?.click()}
          >
            <div className="h-24 w-24 overflow-hidden rounded-full border border-white/15 bg-[#141418]">
              {avatarPath ? (
                <StorageImage
                  path={avatarPath}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white/35">
                  <User size={32} />
                </div>
              )}
            </div>
            <button
              type="button"
              aria-label="Upload avatar"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-[#101014] text-white transition-transform group-hover:scale-105 cursor-pointer"
            >
              <Camera size={14} />
            </button>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-white">Publisher Portrait</h2>
            <p className="text-xs text-white/60">
              Click the portrait to upload an avatar stored in Supabase Storage.
            </p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="p-8 space-y-6">
          <h3 className="text-xs uppercase tracking-[0.22em] text-white/45">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
            />
            <Input
              label="Display Name"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="e.g. Jane"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-white/65">Timezone</label>
            <div className="relative">
              <Globe
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                size={16}
              />
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="w-full appearance-none rounded-lg border border-white/15 bg-black pl-10 pr-9 py-2.5 text-sm text-white focus:border-white focus:outline-none"
              >
                <option>UTC-8 (Pacific Time)</option>
                <option>UTC-5 (Eastern Time)</option>
                <option>UTC+0 (London)</option>
                <option>UTC+1 (Paris)</option>
                <option>UTC+9 (Tokyo)</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-white/40" size={14} />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/45">
            <Shield size={14} />
            <span>Security</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#101014] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black text-white/60">
                <Key size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Password</p>
                <p className="text-xs text-white/50">Send a password reset link via Supabase Auth</p>
              </div>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={handlePasswordReset}>
              Reset Password
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-8 py-5 bg-[#101014]">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs font-medium text-white/60 hover:text-red-400 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate(RoutePath.HOME)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={loading}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};