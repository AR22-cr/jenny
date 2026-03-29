/**
 * Home Screen — Apple Widget-Style Grid
 * ──────────────────────────────────────
 * iOS 17 widget-inspired layout. Compact, informative widgets.
 */
import Jenny from '@/components/Jenny';
import { Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme';
import { useCheckInStorage } from '@/hooks/useStorage';
import { useSettings } from '@/hooks/useSettings';
import { useSupabase } from '@/hooks/useSupabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { Flame, CheckCircle, Clock, BarChart3 } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
    Dimensions,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 8;
const GRID_PADDING = 16;
const SMALL_WIDGET_W = (SCREEN_W - GRID_PADDING * 2 - GRID_GAP) / 2;

export default function HomeScreen() {
    const router = useRouter();
    const { getStreak, getRecentCheckIns, getSimulatedDate, reload } = useCheckInStorage();
    const { settings, reloadSettings } = useSettings();
    
    useFocusEffect(
        useCallback(() => {
            reload();
            reloadSettings();
        }, [reload, reloadSettings])
    );

    const simulatedDate = getSimulatedDate(settings.debugDateOffset);
    const hour = settings.debugHourOverride !== null 
        ? settings.debugHourOverride 
        : simulatedDate.getHours();
        
    const isEvening = hour >= 17;
    const isNight = hour >= 20 || hour < 5;
    const isMorning = hour >= 5 && hour < 12;

    const greeting = isMorning ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const streak = getStreak(settings.debugDateOffset);
    const recentCheckIns = getRecentCheckIns(5);

    const jennyMood = isNight ? 'sleepy' : isEvening ? 'curious' : 'happy';
    const { activeDeck, loadingDeck, refreshDeck, patientProfile } = useSupabase();

    // Temporal lockout
    const latestCheckIn = recentCheckIns[0];
    const todayStr = simulatedDate.toISOString().split('T')[0];
    const isCompletedToday = latestCheckIn && latestCheckIn.date === todayStr;

    let completedTimeLabel = '';
    if (isCompletedToday && latestCheckIn.completedAt) {
        const d = new Date(latestCheckIn.completedAt);
        completedTimeLabel = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    const ctaEnabled = activeDeck && !loadingDeck && !isCompletedToday;

    const statusMessage = loadingDeck ? 'Checking with your doctor...'
        : !activeDeck ? "Your doctor hasn't assigned a check-in deck yet."
        : isCompletedToday ? `Checked in at ${completedTimeLabel}`
        : isEvening || isNight ? "Tonight's check-in is ready"
        : 'Your next check-in is tonight';

    // Computed stats
    const totalCheckIns = recentCheckIns.length;
    const completedCount = recentCheckIns.filter(c => c.questionsAnswered === c.questionsTotal).length;
    const completionRate = totalCheckIns > 0 ? Math.round((completedCount / totalCheckIns) * 100) : 0;
    const lastCheckInLabel = totalCheckIns > 0 
        ? new Date(recentCheckIns[0].date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
        : '—';
    const lastCheckInFull = totalCheckIns > 0
        ? new Date(recentCheckIns[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'No data';

    // Average questions answered
    const avgAnswered = totalCheckIns > 0
        ? Math.round(recentCheckIns.reduce((sum, c) => sum + c.questionsAnswered, 0) / totalCheckIns)
        : 0;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loadingDeck} onRefresh={refreshDeck} tintColor={Colors.glacier} />
                }
            >
                {/* ── Greeting Header ── */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.greetingArea}>
                    <Text style={styles.greetingText}>{greeting}</Text>
                    <Text style={styles.dateText}>
                        {simulatedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                </Animated.View>

                {/* ══════ Jenny Hero + CTA combined ══════ */}
                <Animated.View entering={FadeInDown.delay(100).duration(500).springify()}>
                    <LinearGradient 
                        colors={['#FFD6E0', '#FFEAEF', '#FFF5F8']} 
                        style={styles.heroWidget}
                    >
                        <View style={styles.heroRow}>
                            <Jenny size={72} mood={jennyMood} animate={true} />
                            <View style={styles.heroTextArea}>
                                <Text style={styles.heroTitle}>{patientProfile?.name || 'Jenny'}</Text>
                                <Text style={styles.heroStatus}>{statusMessage}</Text>
                                {streak > 0 && (
                                    <View style={styles.streakPill}>
                                        <Flame size={12} color="#FF8C42" />
                                        <Text style={styles.streakPillText}>{streak}-day streak</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <Pressable
                            style={({ pressed }) => [
                                styles.ctaButton,
                                !ctaEnabled && styles.ctaDisabled,
                                pressed && ctaEnabled && styles.ctaPressed,
                            ]}
                            onPress={() => { if (ctaEnabled) router.push('/check-in'); }}
                        >
                            <Text style={styles.ctaText}>
                                {loadingDeck ? 'Loading...' 
                                    : !activeDeck ? 'Waiting on Doctor' 
                                    : isCompletedToday ? 'Check-In Complete' 
                                    : 'Start Check-In'}
                            </Text>
                        </Pressable>
                    </LinearGradient>
                </Animated.View>

                {/* ══════ 2×2 STAT GRID ══════ */}
                <View style={styles.widgetGrid}>
                    {/* Streak */}
                    <Animated.View entering={FadeInDown.delay(250).duration(400).springify()} style={styles.smallWidget}>
                        <View style={styles.widgetTopRow}>
                            <View style={[styles.widgetIcon, { backgroundColor: '#FFF0E6' }]}>
                                <Flame size={16} color="#FF8C42" />
                            </View>
                            <Text style={styles.widgetMiniLabel}>Streak</Text>
                        </View>
                        <Text style={styles.widgetValue}>{streak}</Text>
                        <Text style={styles.widgetSub}>{streak > 0 ? 'days in a row' : 'Start tonight!'}</Text>
                    </Animated.View>

                    {/* Completion */}
                    <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} style={styles.smallWidget}>
                        <View style={styles.widgetTopRow}>
                            <View style={[styles.widgetIcon, { backgroundColor: '#E8F8EE' }]}>
                                <CheckCircle size={16} color={Colors.moss} />
                            </View>
                            <Text style={styles.widgetMiniLabel}>Completion</Text>
                        </View>
                        <Text style={styles.widgetValue}>{completionRate}%</Text>
                        <Text style={styles.widgetSub}>{completedCount}/{totalCheckIns} fully completed</Text>
                    </Animated.View>

                    {/* Total */}
                    <Animated.View entering={FadeInDown.delay(350).duration(400).springify()} style={styles.smallWidget}>
                        <View style={styles.widgetTopRow}>
                            <View style={[styles.widgetIcon, { backgroundColor: Colors.ice }]}>
                                <BarChart3 size={16} color={Colors.glacier} />
                            </View>
                            <Text style={styles.widgetMiniLabel}>Check-Ins</Text>
                        </View>
                        <Text style={styles.widgetValue}>{totalCheckIns}</Text>
                        <Text style={styles.widgetSub}>avg {avgAnswered} questions</Text>
                    </Animated.View>

                    {/* Last */}
                    <Animated.View entering={FadeInDown.delay(400).duration(400).springify()} style={styles.smallWidget}>
                        <View style={styles.widgetTopRow}>
                            <View style={[styles.widgetIcon, { backgroundColor: '#F0EEFF' }]}>
                                <Clock size={16} color="#7C6AEF" />
                            </View>
                            <Text style={styles.widgetMiniLabel}>Last</Text>
                        </View>
                        <Text style={styles.widgetValue}>{lastCheckInLabel}</Text>
                        <Text style={styles.widgetSub}>{lastCheckInFull}</Text>
                    </Animated.View>
                </View>

                {/* ══════ Recent Activity ══════ */}
                <Animated.View entering={FadeInUp.delay(450).duration(500).springify()} style={styles.recentWidget}>
                    <View style={styles.recentHeader}>
                        <Text style={styles.recentTitle}>Recent</Text>
                        <Pressable onPress={() => router.push('/(tabs)/history')}>
                            <Text style={styles.seeAll}>See All</Text>
                        </Pressable>
                    </View>

                    {recentCheckIns.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Jenny size={36} mood="curious" animate={false} />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.emptyTitle}>No check-ins yet</Text>
                                <Text style={styles.emptyBody}>Complete your first check-in tonight.</Text>
                            </View>
                        </View>
                    ) : (
                        <>
                            {recentCheckIns.slice(0, 4).map((c, idx) => {
                                const dateLabel = new Date(c.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                const pct = c.questionsTotal > 0 ? Math.round((c.questionsAnswered / c.questionsTotal) * 100) : 0;
                                const isComplete = pct >= 100;
                                return (
                                    <View key={c.id} style={[styles.recentRow, idx < Math.min(recentCheckIns.length, 4) - 1 && styles.recentRowBorder]}>
                                        <View style={[styles.recentDot, isComplete ? { backgroundColor: Colors.moss } : { backgroundColor: Colors.glacier }]} />
                                        <View style={styles.recentRowText}>
                                            <Text style={styles.recentDate}>{dateLabel}</Text>
                                            <Text style={styles.recentMeta}>{c.questionsAnswered}/{c.questionsTotal} answered</Text>
                                        </View>
                                        <Text style={[styles.recentPct, isComplete && { color: Colors.moss }]}>{pct}%</Text>
                                    </View>
                                );
                            })}
                        </>
                    )}
                </Animated.View>

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.fog,
    },
    scrollContent: {
        paddingHorizontal: GRID_PADDING,
        paddingTop: Spacing.sm,
    },

    // ── Greeting ──
    greetingArea: {
        marginBottom: Spacing.sm,
        paddingHorizontal: 4,
    },
    greetingText: {
        fontFamily: Fonts.displayBold,
        fontSize: 26,
        color: Colors.ink,
        letterSpacing: -0.5,
    },
    dateText: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.xs,
        color: Colors.slate,
        marginTop: 1,
    },

    // ══════ Hero Widget (Jenny + CTA combined) ══════
    heroWidget: {
        borderRadius: Radii.widget,
        padding: Spacing.md,
        marginBottom: GRID_GAP,
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    heroTextArea: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    heroTitle: {
        fontFamily: Fonts.displayBold,
        fontSize: FontSizes.md,
        color: Colors.ink,
        marginBottom: 2,
    },
    heroStatus: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.sm,
        color: Colors.ink,
        opacity: 0.6,
        lineHeight: FontSizes.sm * 1.4,
    },
    streakPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,140,66,0.12)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    streakPillText: {
        fontFamily: Fonts.monoMedium,
        fontSize: 11,
        color: '#FF8C42',
    },
    ctaButton: {
        backgroundColor: Colors.glacier,
        borderRadius: 14,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaDisabled: {
        backgroundColor: '#C7C7CC',
    },
    ctaPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    ctaText: {
        fontFamily: Fonts.displayBold,
        fontSize: FontSizes.base,
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },

    // ══════ 2×2 Stat Grid ══════
    widgetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GRID_GAP,
        marginBottom: GRID_GAP,
    },
    smallWidget: {
        width: SMALL_WIDGET_W,
        backgroundColor: Colors.snow,
        borderRadius: Radii.widget,
        padding: 14,
    },
    widgetTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    widgetIcon: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    widgetMiniLabel: {
        fontFamily: Fonts.mono,
        fontSize: 11,
        color: Colors.slate,
        letterSpacing: 0.2,
    },
    widgetValue: {
        fontFamily: Fonts.displayBold,
        fontSize: 24,
        color: Colors.ink,
        letterSpacing: -0.5,
        marginBottom: 1,
    },
    widgetSub: {
        fontFamily: Fonts.body,
        fontSize: 11,
        color: Colors.slate,
        lineHeight: 14,
    },

    // ══════ Recent Activity Widget ══════
    recentWidget: {
        backgroundColor: Colors.snow,
        borderRadius: Radii.widget,
        padding: 14,
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    recentTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: FontSizes.sm,
        color: Colors.ink,
    },
    seeAll: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.xs,
        color: Colors.glacier,
    },
    recentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    recentRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    recentDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    recentRowText: {
        flex: 1,
    },
    recentDate: {
        fontFamily: Fonts.monoMedium,
        fontSize: 12,
        color: Colors.ink,
    },
    recentMeta: {
        fontFamily: Fonts.mono,
        fontSize: 11,
        color: Colors.slate,
    },
    recentPct: {
        fontFamily: Fonts.displayBold,
        fontSize: FontSizes.sm,
        color: Colors.glacier,
    },

    // ── Empty State ──
    emptyState: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    emptyTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: FontSizes.sm,
        color: Colors.ink,
        marginBottom: 1,
    },
    emptyBody: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.xs,
        color: Colors.slate,
    },
});
