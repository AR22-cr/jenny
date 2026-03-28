/**
 * useStorage — AsyncStorage persistence layer
 * ─────────────────────────────────────────────
 * Stores and retrieves check-in responses.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useSettings } from './useSettings';

const STORAGE_KEY = '@penguinpals:checkins';

export interface StoredCheckIn {
    id: string;
    date: string;           // ISO date string
    answers: Record<string, any>;
    questionsTotal: number;
    questionsAnswered: number;
    completedAt: string;     // ISO timestamp
}

async function loadCheckIns(): Promise<StoredCheckIn[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

async function saveCheckIns(checkIns: StoredCheckIn[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns));
}

export function useCheckInStorage() {
    const { settings } = useSettings();
    const [checkIns, setCheckIns] = useState<StoredCheckIn[]>([]);
    const [loading, setLoading] = useState(true);

    const getSimulatedDate = useCallback(() => {
        const now = new Date();
        if (settings.debugDateOffset) {
            now.setDate(now.getDate() + settings.debugDateOffset);
        }
        return now;
    }, [settings.debugDateOffset]);

    useEffect(() => {
        loadCheckIns().then((data) => {
            setCheckIns(data);
            setLoading(false);
        });
    }, []);

    const addCheckIn = useCallback(async (
        answers: Record<string, any>,
        questionsTotal: number,
    ) => {
        const now = getSimulatedDate();
        const entry: StoredCheckIn = {
            id: `checkin-${now.getTime()}`,
            date: now.toISOString().split('T')[0],
            answers,
            questionsTotal,
            questionsAnswered: Object.keys(answers).filter(
                (k) => answers[k] !== null && answers[k] !== undefined && answers[k] !== ''
            ).length,
            completedAt: now.toISOString(),
        };

        const updated = [entry, ...checkIns];
        setCheckIns(updated);
        await saveCheckIns(updated);
        return entry;
    }, [checkIns]);

    const getCheckIn = useCallback((id: string) => {
        return checkIns.find((c) => c.id === id) ?? null;
    }, [checkIns]);

    const getStreak = useCallback(() => {
        if (checkIns.length === 0) return 0;

        let streak = 0;
        const today = getSimulatedDate();
        today.setHours(0, 0, 0, 0);

        for (let d = 0; d < 365; d++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - d);
            const dateStr = checkDate.toISOString().split('T')[0];
            const has = checkIns.some((c) => c.date === dateStr);
            if (has) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }, [checkIns]);

    const getRecentCheckIns = useCallback((count: number = 5) => {
        return checkIns.slice(0, count);
    }, [checkIns]);

    // Group by week for history screen
    const getCheckInsByWeek = useCallback(() => {
        const weeks: Record<string, StoredCheckIn[]> = {};
        checkIns.forEach((c) => {
            const date = new Date(c.date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            if (!weeks[weekKey]) weeks[weekKey] = [];
            weeks[weekKey].push(c);
        });
        return Object.entries(weeks).sort(([a], [b]) => b.localeCompare(a));
    }, [checkIns]);

    const clearHistory = useCallback(async () => {
        setCheckIns([]);
        await saveCheckIns([]);
    }, []);

    const reload = useCallback(async () => {
        setLoading(true);
        const data = await loadCheckIns();
        setCheckIns(data);
        setLoading(false);
    }, []);

    return {
        checkIns,
        loading,
        addCheckIn,
        getCheckIn,
        getStreak,
        getRecentCheckIns,
        getCheckInsByWeek,
        getSimulatedDate,
        clearHistory,
        reload,
    };
}
