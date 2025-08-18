import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export type ThemeAccent = 'rainbow' | 'trans' | 'lesbian' | 'bi' | 'pan' | 'ace';

const themePresets = {
  rainbow: {
    primary: '280 70% 65%',
    primaryGlow: '280 80% 75%',
    accent: '215 80% 60%',
    accentGlow: '215 90% 70%',
    gradientPrimary: 'linear-gradient(135deg, hsl(280 70% 65%), hsl(280 80% 75%))',
    gradientAccent: 'linear-gradient(135deg, hsl(215 80% 60%), hsl(215 90% 70%))'
  },
  trans: {
    primary: '195 100% 75%', // Light blue
    primaryGlow: '195 100% 85%',
    accent: '325 100% 85%', // Pink
    accentGlow: '325 100% 90%',
    gradientPrimary: 'linear-gradient(135deg, hsl(195 100% 75%), hsl(325 100% 85%))',
    gradientAccent: 'linear-gradient(135deg, hsl(195 100% 85%), hsl(0 0% 100%))'
  },
  lesbian: {
    primary: '20 95% 65%', // Orange
    primaryGlow: '20 95% 75%',
    accent: '340 85% 70%', // Pink
    accentGlow: '340 85% 80%',
    gradientPrimary: 'linear-gradient(135deg, hsl(20 95% 65%), hsl(340 85% 70%))',
    gradientAccent: 'linear-gradient(135deg, hsl(340 85% 70%), hsl(20 95% 65%))'
  },
  bi: {
    primary: '300 85% 60%', // Magenta
    primaryGlow: '300 85% 70%',
    accent: '240 85% 65%', // Blue
    accentGlow: '240 85% 75%',
    gradientPrimary: 'linear-gradient(135deg, hsl(300 85% 60%), hsl(240 85% 65%))',
    gradientAccent: 'linear-gradient(135deg, hsl(240 85% 65%), hsl(300 85% 60%))'
  },
  pan: {
    primary: '320 85% 70%', // Pink
    primaryGlow: '320 85% 80%',
    accent: '50 95% 65%', // Yellow
    accentGlow: '50 95% 75%',
    gradientPrimary: 'linear-gradient(135deg, hsl(320 85% 70%), hsl(50 95% 65%))',
    gradientAccent: 'linear-gradient(135deg, hsl(190 85% 65%), hsl(320 85% 70%))'
  },
  ace: {
    primary: '280 15% 40%', // Dark gray
    primaryGlow: '280 15% 50%',
    accent: '280 85% 65%', // Purple
    accentGlow: '280 85% 75%',
    gradientPrimary: 'linear-gradient(135deg, hsl(280 15% 40%), hsl(280 85% 65%))',
    gradientAccent: 'linear-gradient(135deg, hsl(280 85% 65%), hsl(0 0% 100%))'
  }
};

export const useThemeAccent = () => {
  const { user } = useAuth();
  const [themeAccent, setThemeAccent] = useState<ThemeAccent>('rainbow');

  // Load theme from user profile
  useEffect(() => {
    if (!user) return;

    const loadTheme = async () => {
      // Temporarily disabled until theme_accent column is added
      // const { data, error } = await supabase
      //   .from('profiles')
      //   .select('theme_accent')
      //   .eq('user_id', user.id)
      //   .single();

      // if (!error && data?.theme_accent) {
      //   setThemeAccent(data.theme_accent as ThemeAccent);
      //   applyTheme(data.theme_accent as ThemeAccent);
      // }
    };

    loadTheme();
  }, [user]);

  const applyTheme = (theme: ThemeAccent) => {
    const root = document.documentElement;
    const preset = themePresets[theme];

    // Update CSS variables
    root.style.setProperty('--primary', preset.primary);
    root.style.setProperty('--primary-glow', preset.primaryGlow);
    root.style.setProperty('--accent', preset.accent);
    root.style.setProperty('--accent-glow', preset.accentGlow);
    root.style.setProperty('--gradient-primary', preset.gradientPrimary);
    root.style.setProperty('--gradient-accent', preset.gradientAccent);

    // Add transition for smooth color changes
    root.style.setProperty('transition', 'background-color 0.4s ease, color 0.4s ease');
  };

  const updateThemeAccent = async (newTheme: ThemeAccent) => {
    if (!user) return;

    // Temporarily disabled until theme_accent column is added
    // const { error } = await supabase
    //   .from('profiles')
    //   .update({ theme_accent: newTheme } as any)
    //   .eq('user_id', user.id);

    // For now, just apply the theme locally
    setThemeAccent(newTheme);
    applyTheme(newTheme);
  };

  return {
    themeAccent,
    updateThemeAccent,
    themePresets: Object.keys(themePresets) as ThemeAccent[]
  };
};