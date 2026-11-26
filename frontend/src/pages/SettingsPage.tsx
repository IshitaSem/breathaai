import React, { useState, useEffect } from 'react';
import { Sliders, CheckCircle, RotateCcw, User, Bell, Shield, Palette } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SUPPORTED_CITIES } from '../constants/mockData';

interface FormErrors {
  name?: string;
  email?: string;
  fam?: string;
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
  const { setTheme } = useTheme();

  const [name, setName] = useState(state.name);
  const [email, setEmail] = useState(state.email);
  const [loc, setLoc] = useState(state.loc);
  const [fam, setFam] = useState(String(state.fam));
  const [life, setLife] = useState(state.life);
  const [sens, setSens] = useState(state.sens);

  const [alertNotif, setAlertNotif] = useState(state.nt.alert);
  const [dailyNotif, setDailyNotif] = useState(state.nt.daily);
  const [weeklyNotif, setWeeklyNotif] = useState(state.nt.weekly);

  const [shareImpact, setShareImpact] = useState(state.priv.share);
  const [anonLeaderboard, setAnonLeaderboard] = useState(state.priv.anon);

  const [selectedTheme, setSelectedTheme] = useState<'auto' | 'light' | 'dark'>(
    state.theme || 'auto'
  );
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setName(state.name);
    setEmail(state.email);
    setLoc(state.loc);
    setFam(String(state.fam));
    setLife(state.life);
    setSens(state.sens);
    setAlertNotif(state.nt.alert);
    setDailyNotif(state.nt.daily);
    setWeeklyNotif(state.nt.weekly);
    setShareImpact(state.priv.share);
    setAnonLeaderboard(state.priv.anon);
    setSelectedTheme(state.theme || 'auto');
  }, [state]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const parsedFam = Number(fam);

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
      loc,
      fam: parsedFam,
      life,
      sens,
      theme: selectedTheme,
      nt: {
        alert: alertNotif,
        daily: dailyNotif,
        weekly: weeklyNotif,
      },
      priv: {
        share: shareImpact,
        anon: anonLeaderboard,
      },
    });

    setTheme(selectedTheme);
    showToast('Settings successfully updated');
  };

  const handleReset = () => {
    resetAllSettings();
    setTheme('auto');
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
                value={name}
                onChange={e => setName(e.target.value)}
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
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                  value={loc}
                  onChange={e => setLoc(e.target.value)}
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
                  value={fam}
                  onChange={e => setFam(e.target.value)}
                />
                <div className="err">{errors.fam}</div>
              </div>
            </div>

            <div className="f mt-3">
              <label htmlFor="sy">Commute & Lifestyle Pattern</label>
              <select
                id="sy"
                className="in"
                value={life}
                onChange={e => setLife(e.target.value)}
              >
                {[
                  'Mixed commute',
                  'Work from home',
                  'Daily driver',
                  'Public transport user',
                ].map(opt => (
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
                value={sens}
                onChange={e => setSens(e.target.value)}
              >
                {[
                  'None',
                  'Children / elderly at home',
                  'Asthma or lung condition',
                  'Heart condition',
                ].map(opt => (
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
                  checked={alertNotif}
                  onChange={setAlertNotif}
                />
                <ToggleRow
                  label="Daily Morning Summary"
                  description="Clean-air outdoor window & morning briefing"
                  checked={dailyNotif}
                  onChange={setDailyNotif}
                />
                <ToggleRow
                  label="Weekly Carbon Impact Report"
                  description="Summary of avoided CO₂e from completed routines"
                  checked={weeklyNotif}
                  onChange={setWeeklyNotif}
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
                  checked={shareImpact}
                  onChange={setShareImpact}
                />
                <ToggleRow
                  label="Anonymous Leaderboard Display"
                  description="Keep your profile identity hidden on challenge boards"
                  checked={anonLeaderboard}
                  onChange={setAnonLeaderboard}
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
                  value={selectedTheme}
                  onChange={e => setSelectedTheme(e.target.value as 'auto' | 'light' | 'dark')}
                >
                  <option value="auto">System Default (Automatic)</option>
                  <option value="light">Warm Editorial Light</option>
                  <option value="dark">Botanical Dark</option>
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
            <button type="button" className="btn o" onClick={handleReset}>
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
