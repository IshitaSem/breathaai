import React, { useState, useEffect } from 'react';
import { Sliders, CheckCircle, RotateCcw, User, Bell, Shield, Palette } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_CITIES } from '../constants/mockData';
import { StoredAppState } from '../services/storage';
import { ThemeMode } from '../types';

interface FormErrors {
  name?: string;
  email?: string;
  fam?: string;
}

interface SettingsFormState {
  name: string;
  email: string;
  loc: string;
  fam: string;
  life: string;
  sens: string;
  alertNotif: boolean;
  dailyNotif: boolean;
  weeklyNotif: boolean;
  shareImpact: boolean;
  anonLeaderboard: boolean;
  theme: ThemeMode;
}

const COMMUTE_OPTIONS = [
  'Mixed commute',
  'Work from home',
  'Daily driver',
  'Public transport user',
] as const;

const SENSITIVITY_OPTIONS = [
  'None',
  'Children / elderly at home',
  'Asthma or lung condition',
  'Heart condition',
] as const;

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'auto', label: 'System Default (Automatic)' },
  { value: 'light', label: 'Warm Editorial Light' },
  { value: 'dark', label: 'Botanical Dark' },
];

function toFormState(state: StoredAppState): SettingsFormState {
  return {
    name: state.name,
    email: state.email,
    loc: state.loc,
    fam: String(state.fam),
    life: state.life,
    sens: state.sens,
    alertNotif: state.nt.alert,
    dailyNotif: state.nt.daily,
    weeklyNotif: state.nt.weekly,
    shareImpact: state.priv.share,
    anonLeaderboard: state.priv.anon,
    theme: state.theme || 'auto',
  };
}

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, checked, onChange }) => (
  <label className="flex items-center justify-between gap-4 py-3 border-b border-line/70 last:border-0 cursor-pointer font-normal m-0">
    <div>
      <div className="text-sm font-medium text-ink">{label}</div>
      {description && <div className="text-xs text-mute mt-0.5">{description}</div>}
    </div>
    <span className="bw-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="bw-switch-track">
        <span className="bw-switch-thumb" />
      </span>
    </span>
  </label>
);

export const SettingsPage: React.FC = () => {
  const { state, updateUserPreferences, resetAllSettings, showToast } = useApp();
  const [form, setForm] = useState<SettingsFormState>(() => toFormState(state));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setForm(toFormState(state));
  }, [
    state.name,
    state.email,
    state.loc,
    state.fam,
    state.life,
    state.sens,
    state.nt,
    state.priv,
    state.theme,
  ]);

  const updateField = <K extends keyof SettingsFormState>(key: K, value: SettingsFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const parsedFam = Number(form.fam);

    if (!trimmedName) {
      newErrors.name = 'Name is required.';
    }

    if (trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!Number.isInteger(parsedFam) || parsedFam < 1 || parsedFam > 20) {
      newErrors.fam = 'Enter a valid household size (1 to 20 people).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    updateUserPreferences({
      name: trimmedName,
      email: trimmedEmail,
      loc: form.loc,
      fam: parsedFam,
      life: form.life,
      sens: form.sens,
      theme: form.theme,
      nt: {
        alert: form.alertNotif,
        daily: form.dailyNotif,
        weekly: form.weeklyNotif,
      },
      priv: {
        share: form.shareImpact,
        anon: form.anonLeaderboard,
      },
    });

    showToast('Settings successfully updated');
  };

  return (
    <div className="space-y-7 max-w-5xl">
      {/* Header */}
      <div className="row justify-between items-start">
        <div>
          <h1>Settings & Preferences</h1>
          <div className="sub">
            Personalize your household profile, alert thresholds, privacy, and appearance
          </div>
        </div>
        <span className="badge">
          <Sliders size={12} />
          Profile Config
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid g2">
          {/* Profile & Household */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-line/70">
              <User size={18} className="text-forest" />
              <h2 className="m-0">Profile & Household</h2>
            </div>

            <div className="f">
              <label htmlFor="sn">Your Name</label>
              <input
                id="sn"
                type="text"
                className="in"
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
                placeholder="e.g. Ishita"
              />
              <div className="err">{errors.name}</div>
            </div>

            <div className="f">
              <label htmlFor="se">Email Address (optional)</label>
              <input
                id="se"
                type="email"
                className="in"
                value={form.email}
                onChange={e => updateField('email', e.target.value)}
                placeholder="you@domain.com"
              />
              <div className="err">{errors.email}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="f mb-0">
                <label htmlFor="sl">Primary Location</label>
                <select
                  id="sl"
                  className="in"
                  value={form.loc}
                  onChange={e => updateField('loc', e.target.value)}
                >
                  {Object.keys(SUPPORTED_CITIES).map(city => (
                    <option key={city} value={city}>
                      {city} ({SUPPORTED_CITIES[city].state})
                    </option>
                  ))}
                </select>
              </div>

              <div className="f mb-0">
                <label htmlFor="sf">Household Size</label>
                <input
                  id="sf"
                  type="number"
                  min="1"
                  max="20"
                  className="in"
                  value={form.fam}
                  onChange={e => updateField('fam', e.target.value)}
                />
                <div className="err">{errors.fam}</div>
              </div>
            </div>

            <div className="f mt-3">
              <label htmlFor="sy">Commute & Lifestyle Pattern</label>
              <select
                id="sy"
                className="in"
                value={form.life}
                onChange={e => updateField('life', e.target.value)}
              >
                {COMMUTE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="f mb-0">
              <label htmlFor="ss">Health Sensitivity Profile</label>
              <select
                id="ss"
                className="in"
                value={form.sens}
                onChange={e => updateField('sens', e.target.value)}
              >
                {SENSITIVITY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notifications, Privacy and Theme */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="card">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-line/70">
                <Bell size={18} className="text-forest" />
                <h2 className="m-0">Air Alerts & Notifications</h2>
              </div>
              <div>
                <ToggleRow
                  label="Severe Air Alerts"
                  description="Notify when AQI exceeds 200 (Poor or worse)"
                  checked={form.alertNotif}
                  onChange={val => updateField('alertNotif', val)}
                />
                <ToggleRow
                  label="Daily Morning Summary"
                  description="Clean-air outdoor window & morning briefing"
                  checked={form.dailyNotif}
                  onChange={val => updateField('dailyNotif', val)}
                />
                <ToggleRow
                  label="Weekly Carbon Impact Report"
                  description="Summary of avoided CO₂e from completed routines"
                  checked={form.weeklyNotif}
                  onChange={val => updateField('weeklyNotif', val)}
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-line/70">
                <Shield size={18} className="text-forest" />
                <h2 className="m-0">Privacy & Appearance</h2>
              </div>
              <div>
                <ToggleRow
                  label="Share Anonymous Carbon Savings"
                  description="Include your avoided emissions in community totals"
                  checked={form.shareImpact}
                  onChange={val => updateField('shareImpact', val)}
                />
                <ToggleRow
                  label="Anonymous Leaderboard Display"
                  description="Keep your profile identity hidden on challenge boards"
                  checked={form.anonLeaderboard}
                  onChange={val => updateField('anonLeaderboard', val)}
                />
              </div>

              <div className="mt-4 pt-3 border-t border-line/70">
                <label htmlFor="th" className="flex items-center gap-1.5">
                  <Palette size={14} className="text-forest" />
                  <span>Interface Theme</span>
                </label>
                <select
                  id="th"
                  className="in w-full"
                  value={form.theme}
                  onChange={e => updateField('theme', e.target.value as ThemeMode)}
                >
                  {THEME_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="card py-4 px-6 flex flex-wrap items-center justify-between gap-3 bg-cream/60">
          <span className="sub text-xs">
            Changes are saved locally and synced with the backend when available.
          </span>
          <div className="row">
            <button type="button" className="btn o" onClick={resetAllSettings}>
              <RotateCcw size={16} />
              Reset Defaults
            </button>
            <button type="submit" className="btn">
              <CheckCircle size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
