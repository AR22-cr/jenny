/**
 * Home Screen (§5.4)
 * ──────────────────
 * - Pip Hero Area (top 40%): fog bg with day/night sky, Pip centered
 * - "Tonight's check-in is ready" or countdown — Canela 22px (we use md=20)
 * - Streak badge: glacier pill, DM Mono
 * - CTA: aurora fill, full-width, 28px radius
 * - Recent Activity strip
 * - Motivational micro-copy
 */
import Pip from '@/components/Pip';
import { Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme';
import { useCheckInStorage } from '@/hooks/useStorage';
import { useSettings } from '@/hooks/useSettings';
import { useSupabase } from '@/hooks/useSupabase';
import { Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { Dimensions, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';

const { width } = Dimensions.get('window');



export default function HomeScreen() {
    const router = useRouter();
    const { getStreak, getRecentCheckIns, getSimulatedDate, reload } = useCheckInStorage();
    const { settings } = useSettings();
    
    useFocusEffect(
        useCallback(() => {
            reload();
        }, [reload])
    );

    // Apply time override if active
    const simulatedDate = getSimulatedDate();
    const hour = settings.debugHourOverride !== null 
        ? settings.debugHourOverride 
        : simulatedDate.getHours();
        
    const isEvening = hour >= 17;
    const isNight = hour >= 20 || hour < 5;
    const isMorning = hour >= 5 && hour < 12;

    const greeting = isMorning ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const streak = getStreak();
    const recentCheckIns = getRecentCheckIns(5);
    const dayIndex = simulatedDate.getDate();

    // §5.4: Day/night sky changes based on time of day
    const skyColors = (isNight || isEvening
        ? [Colors.fog, '#D6E4EE', '#C8D8E4'] as const // Cool evening tones
        : [Colors.fog, '#DEE9F2', Colors.fog] as const); // Daytime soft blue

    const pipMood = isNight ? 'sleepy' : isEvening ? 'curious' : 'happy';
    const { activeDeck, loadingDeck, refreshDeck } = useSupabase();

    // Temporal lockout logic
    const latestCheckIn = recentCheckIns[0];
    const todayStr = simulatedDate.toISOString().split('T')[0];
    const isCompletedToday = latestCheckIn && latestCheckIn.date === todayStr;

    let completedTimeLabel = '';
    if (isCompletedToday && latestCheckIn.completedAt) {
        const d = new Date(latestCheckIn.completedAt);
        completedTimeLabel = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* §5.4: Pip Hero Area (top ~40%) */}
            <LinearGradient colors={skyColors} style={styles.heroArea}>
                {/* Organic shape blob behind Pip */}
                <View style={styles.heroBlob} />
                <View style={styles.heroBlob2} />

                <Pip size={100} mood={pipMood} />

                <Text style={styles.heroText}>
                    {loadingDeck ? 'Checking with your doctor...'
                        : !activeDeck
                            ? "Your doctor hasn't assigned a check-in deck yet."
                            : isCompletedToday
                                ? `You checked in today at ${completedTimeLabel}.`
                                : isEvening || isNight
                                    ? "Tonight's check-in is ready."
                                    : 'Your next check-in is tonight.'}
                </Text>

                {streak > 0 && (
                    <View style={styles.streakBadge}>
                        <Flame size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.streakText}>{streak}-day streak</Text>
                    </View>
                )}
            </LinearGradient>

            <ScrollView 
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={loadingDeck} onRefresh={refreshDeck} tintColor={Colors.glacier} />
                }
            >
                {/* §5.4: Check-In CTA — aurora fill, full-width, 28px radius */}
                <Pressable
                    style={({ pressed }) => [
                        styles.ctaButton, 
                        pressed && activeDeck && !isCompletedToday && styles.ctaPressed,
                        (!activeDeck || loadingDeck || isCompletedToday) && { backgroundColor: Colors.slate, opacity: 0.8 }
                    ]}
                    onPress={() => {
                        if (activeDeck && !loadingDeck && !isCompletedToday) {
                            router.push('/check-in');
                        }
                    }}
                >
                    <Text style={styles.ctaText}>
                        {loadingDeck ? 'Loading...' 
                            : !activeDeck ? 'Waiting on Doctor...' 
                            : isCompletedToday ? 'Check-In Complete' 
                            : 'Start Check-In'}
                    </Text>
                </Pressable>

                {/* §5.4: Recent Activity strip */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>RECENT</Text>
                    <Pressable onPress={() => router.push('/(tabs)/history')}>
                        <Text style={styles.seeAll}>See all</Text>
                    </Pressable>
                </View>

                {recentCheckIns.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Pip size={48} mood="curious" />
                        <View style={styles.emptyTextArea}>
                            <Text style={styles.emptyTitle}>No check-ins yet.</Text>
                            <Text style={styles.emptyBody}>
                                Complete your first check-in and it'll appear here.
                            </Text>
                        </View>
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
                        {recentCheckIns.map((c) => {
                            const dateLabel = new Date(c.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                            const pct = c.questionsTotal > 0 ? Math.round((c.questionsAnswered / c.questionsTotal) * 100) : 0;
                            return (
                                <View key={c.id} style={styles.recentCard}>
                                    <Text style={styles.recentDate}>{dateLabel}</Text>
                                    <Text style={styles.recentMeta}>{c.questionsAnswered}/{c.questionsTotal}</Text>
                                    <View style={[styles.recentRing, pct >= 100 && styles.recentRingComplete]}>
                                        <Text style={styles.recentPct}>{pct}%</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                )}


            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.fog,
    },

    // ── Hero ──
    heroArea: {
        alignItems: 'center',
        paddingTop: Spacing['3xl'],
        paddingBottom: Spacing.xl,
        overflow: 'hidden',
    },
    heroBlob: {
        position: 'absolute',
        top: -30,
        right: -40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: Colors.ice,
        opacity: 0.4,
        transform: [{ scaleX: 1.3 }],
    },
    heroBlob2: {
        position: 'absolute',
        bottom: -20,
        left: -50,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Colors.aurora,
        opacity: 0.08,
        transform: [{ scaleX: 1.4 }],
    },
    heroText: {
        // §5.4: Canela 22px → Playfair Display md=20
        fontFamily: Fonts.display,
        fontSize: FontSizes.md,
        color: Colors.ink,
        textAlign: 'center',
        lineHeight: FontSizes.md * 1.4,
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.xl,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.glacier,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.full,
        marginTop: Spacing.md,
    },
    streakText: {
        fontFamily: Fonts.monoMedium,
        fontSize: FontSizes.sm,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },

    // ── Content ──
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
    },

    // §5.4: CTA — aurora fill, 28px radius
    ctaButton: {
        backgroundColor: Colors.aurora,
        paddingVertical: 18,
        borderRadius: Radii.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
        ...Shadows.elevated,
    },
    ctaPressed: {
        opacity: 0.92,
        transform: [{ scale: 0.985 }],
    },
    ctaText: {
        fontFamily: Fonts.displayBold,
        fontSize: FontSizes.md,
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },

    // ── Recent ──
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionLabel: {
        fontFamily: Fonts.monoMedium,
        fontSize: FontSizes.xs,
        color: Colors.slate,
        letterSpacing: 2,
    },
    seeAll: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.sm,
        color: Colors.glacier,
    },
    emptyCard: {
        backgroundColor: Colors.snow,
        borderRadius: Radii.lg, // 20px
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        ...Shadows.card,
        marginBottom: Spacing.xl,
    },
    emptyTextArea: {
        flex: 1,
    },
    emptyTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: FontSizes.base,
        color: Colors.ink,
        marginBottom: 2,
    },
    emptyBody: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.sm,
        color: Colors.slate,
        lineHeight: FontSizes.sm * 1.5,
    },

    // ── Motivation ──
    motivation: {
        fontFamily: Fonts.bodyItalic,
        fontSize: FontSizes.sm,
        color: Colors.slate,
        textAlign: 'center',
        lineHeight: FontSizes.sm * 1.6,
        paddingHorizontal: Spacing.md,
    },

    // ── Recent Check-In Cards ──
    recentScroll: {
        marginBottom: Spacing.xl,
    },
    recentCard: {
        backgroundColor: Colors.snow,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        marginRight: Spacing.sm,
        width: 130,
        alignItems: 'center',
        gap: Spacing.xs,
        ...Shadows.card,
    },
    recentDate: {
        fontFamily: Fonts.monoMedium,
        fontSize: FontSizes.xs,
        color: Colors.ink,
    },
    recentMeta: {
        fontFamily: Fonts.mono,
        fontSize: 11,
        color: Colors.slate,
    },
    recentRing: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 3,
        borderColor: Colors.glacier,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recentRingComplete: {
        borderColor: Colors.moss,
        backgroundColor: 'rgba(107, 143, 113, 0.06)',
    },
    recentPct: {
        fontFamily: Fonts.monoMedium,
        fontSize: 10,
        color: Colors.glacier,
    },
});
