/**
 * useSettings — Settings persistence via AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const SETTINGS_KEY = '@jenny:settings';

export interface AppSettings {
    checkInTime: string;        // e.g. "9:00 PM"
    notificationsEnabled: boolean;
    pairingCode: string;
    hasCompletedOnboarding: boolean;
    debugHourOverride: number | null;
    debugDateOffset: number;
}

const DEFAULT_SETTINGS: AppSettings = {
    checkInTime: '9:00 PM',
    notificationsEnabled: true,
    pairingCode: '',
    hasCompletedOnboarding: false,
    debugHourOverride: null,
    debugDateOffset: 0,
};

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
            if (raw) {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
            }
            setLoading(false);
        });
    }, []);

    const updateSetting = useCallback(async <K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K],
    ) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    }, [settings]);

    const reloadSettings = useCallback(async () => {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
        }
    }, []);

    return { settings, loading, updateSetting, reloadSettings };
}
