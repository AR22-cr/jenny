/**
 * Duration — Time duration picker (hours + minutes)
 * ──────────────────────────────────────────────────
 * Allows patients to report a duration (e.g., "How long did you sleep?")
 * Renders hours (0-12) and minutes (0, 15, 30, 45) as selectable pills.
 */
import { Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface DurationProps {
    value: number | null;  // Total minutes
    onChange: (val: number) => void;
}

const HOUR_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTE_OPTIONS = [0, 15, 30, 45];

export default function Duration({ value, onChange }: DurationProps) {
    const hours = value !== null ? Math.floor(value / 60) : null;
    const minutes = value !== null ? value % 60 : null;

    const setDuration = (h: number | null, m: number | null) => {
        const finalH = h ?? hours ?? 0;
        const finalM = m ?? minutes ?? 0;
        onChange(finalH * 60 + finalM);
    };

    return (
        <View style={styles.container}>
            {/* Hours */}
            <Text style={styles.label}>Hours</Text>
            <View style={styles.row}>
                {HOUR_OPTIONS.map(h => (
                    <Pressable
                        key={h}
                        style={[styles.pill, hours === h && styles.pillSelected]}
                        onPress={() => setDuration(h, null)}
                    >
                        <Text style={[styles.pillText, hours === h && styles.pillTextSelected]}>{h}</Text>
                    </Pressable>
                ))}
            </View>

            {/* Minutes */}
            <Text style={[styles.label, { marginTop: Spacing.lg }]}>Minutes</Text>
            <View style={styles.row}>
                {MINUTE_OPTIONS.map(m => (
                    <Pressable
                        key={m}
                        style={[styles.pill, styles.minutePill, minutes === m && styles.pillSelected]}
                        onPress={() => setDuration(null, m)}
                    >
                        <Text style={[styles.pillText, minutes === m && styles.pillTextSelected]}>{m}</Text>
                    </Pressable>
                ))}
            </View>

            {/* Display */}
            {value !== null && (
                <Text style={styles.display}>
                    {Math.floor(value / 60)}h {value % 60}m
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    label: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.xs,
        color: Colors.slate,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: Spacing.sm,
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    pill: {
        width: 44,
        height: 44,
        borderRadius: Radii.full,
        backgroundColor: Colors.snow,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.card,
    },
    minutePill: {
        width: 56,
        borderRadius: Radii.lg,
    },
    pillSelected: {
        backgroundColor: Colors.glacier,
    },
    pillText: {
        fontFamily: Fonts.monoMedium,
        fontSize: FontSizes.sm,
        color: Colors.ink,
    },
    pillTextSelected: {
        color: '#FFFFFF',
    },
    display: {
        marginTop: Spacing.lg,
        fontFamily: Fonts.monoMedium,
        fontSize: FontSizes.lg,
        color: Colors.glacier,
        textAlign: 'center',
    },
});
