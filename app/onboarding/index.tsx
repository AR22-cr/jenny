/**
 * Onboarding Flow (§5.3)
 * ──────────────────────
 * 5-screen first-launch experience:
 *   1. Welcome — "Meet Jenny." Canela 48px
 *   2. How It Works — 3-panel carousel
 *   3. Notifications — "Can Jenny remind you?"
 *   4. Check-In Time — time pill picker
 *   5. Pairing Code — 6-digit entry
 */
import Jenny from '@/components/Jenny';
import { Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSettings } from '../../hooks/useSettings';
import { useSupabase } from '../../hooks/useSupabase';

const { width } = Dimensions.get('window');

const CAROUSEL_PANELS = [
    {
        jennyMood: 'happy' as const,
        title: 'Your doctor creates questions',
        body: 'A short set of questions designed by your doctor, based on what matters most for your care.',
    },
    {
        jennyMood: 'sleepy' as const,
        title: 'Check in every night',
        body: "Every evening, Jenny reminds you to check in. It only takes a few minutes.",
    },
    {
        jennyMood: 'curious' as const,
        title: 'Your doctor stays in the loop',
        body: 'Your responses help your doctor better support you at your next appointment.',
    },
];

// ── Screen 1: Welcome (§5.3) ───────────────────────────────
function WelcomeScreen({ onNext }: { onNext: () => void }) {
    return (
        <View style={styles.screen}>
            <View style={styles.welcomeHero}>
                {/* Organic blob shapes for visual life */}
                <View style={styles.blob1} />
                <View style={styles.blob2} />
                <View style={styles.blob3} />

                <Jenny size={120} mood="happy" />
                {/* §5.3: "Meet Jenny." in Canela 48px */}
                <Text style={styles.meetJennyTitle}>Meet Jenny.</Text>
                {/* §5.3: "Your nightly check-in buddy." in Lora 18px */}
                <Text style={styles.meetJennySubtitle}>Your nightly check-in buddy.</Text>
            </View>
            <View style={styles.bottomArea}>
                {/* §5.3: aurora-filled pill button, full-width */}
                <Pressable
                    style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
                    onPress={onNext}
                >
                    <Text style={styles.ctaText}>Get Started</Text>
                </Pressable>
            </View>
        </View>
    );
}

// ── Screen 2: How It Works Carousel (§5.3) ─────────────────
function HowItWorksScreen({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveIndex(index);
    };

    return (
        <View style={styles.screen}>
            {/* §5.3: skip link top-right */}
            <Pressable style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipText}>Skip</Text>
            </Pressable>

            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                style={styles.carousel}
            >
                {CAROUSEL_PANELS.map((panel, i) => (
                    <View key={i} style={[styles.carouselPanel, { width }]}>
                        <Jenny size={80} mood={panel.jennyMood} />
                        <Text style={styles.panelTitle}>{panel.title}</Text>
                        <Text style={styles.panelBody}>{panel.body}</Text>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.bottomArea}>
                {/* §5.3: Progress dots at bottom */}
                <View style={styles.dotsRow}>
                    {CAROUSEL_PANELS.map((_, i) => (
                        <View key={i} style={[styles.dot, activeIndex === i && styles.dotActive]} />
                    ))}
                </View>
                <Pressable
                    style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
                    onPress={onNext}
                >
                    <Text style={styles.ctaText}>Continue</Text>
                </Pressable>
            </View>
        </View>
    );
}

// ── Screen 3: Notification Permission (§5.3) ───────────────
function NotificationScreen({ onNext }: { onNext: () => void }) {
    return (
        <View style={styles.screen}>
            <View style={styles.centeredHero}>
                <Jenny size={90} mood="curious" />
                <Text style={styles.heroTitle}>Can Jenny remind you?</Text>
                <Text style={styles.heroSubtitle}>
                    We'll send you a gentle nudge at your check-in time. That's all.
                </Text>
            </View>
            <View style={styles.bottomArea}>
                <Pressable
                    style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
                    onPress={onNext}
                >
                    <Text style={styles.ctaText}>Allow Notifications</Text>
                </Pressable>
                {/* §5.3: "Not right now" (ghost button, smaller) */}
                <Pressable style={styles.ghostButton} onPress={onNext}>
                    <Text style={styles.ghostText}>Not right now</Text>
                </Pressable>
            </View>
        </View>
    );
}

// ── Screen 4: Check-In Time (§5.3) ─────────────────────────
function CheckInTimeScreen({ onNext }: { onNext: () => void }) {
    const times = ['8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM'];
    const [selectedTime, setSelectedTime] = useState('9:00 PM');

    return (
        <View style={styles.screen}>
            <View style={styles.centeredHero}>
                <Jenny size={80} mood="sleepy" />
                <Text style={styles.heroTitle}>When do you want to check in?</Text>
                <Text style={styles.heroSubtitle}>
                    Most people choose between 8pm and 10pm.
                </Text>
            </View>

            <View style={styles.timePickerArea}>
                {times.map((time) => (
                    <Pressable
                        key={time}
                        style={[styles.timePill, selectedTime === time && styles.timePillSelected]}
                        onPress={() => setSelectedTime(time)}
                    >
                        <Text
                            style={[styles.timePillText, selectedTime === time && styles.timePillTextSelected]}
                        >
                            {time}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <View style={styles.bottomArea}>
                <Pressable
                    style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
                    onPress={onNext}
                >
                    <Text style={styles.ctaText}>Continue</Text>
                </Pressable>
            </View>
        </View>
    );
}

// ── Screen 5: Pairing Code (§5.3) ──────────────────────────
function PairingCodeScreen({ onComplete, errorMsg }: { onComplete: (code: string) => void; errorMsg?: string }) {
    const [code, setCode] = useState(['', '', '', '', '', '']);

    const handleDigitTap = (digit: string) => {
        const nextEmpty = code.findIndex((d) => d === '');
        if (nextEmpty === -1) return;
        const newCode = [...code];
        newCode[nextEmpty] = digit;
        setCode(newCode);
        if (nextEmpty === 5) setTimeout(() => onComplete(newCode.join('')), 400);
    };

    const handleDelete = () => {
        const lastFilled = code.reduce((last, d, i) => (d !== '' ? i : last), -1);
        if (lastFilled === -1) return;
        const newCode = [...code];
        newCode[lastFilled] = '';
        setCode(newCode);
    };

    return (
        <View style={styles.screen}>
            <View style={styles.centeredHero}>
                <Jenny size={80} mood="curious" />
                <Text style={styles.heroTitle}>Enter your pairing code.</Text>
                <Text style={styles.heroSubtitle}>
                    Your doctor's office will give you a 6-digit code.
                </Text>
                {errorMsg && <Text style={{ color: Colors.blush, marginTop: 10 }}>{errorMsg}</Text>}
            </View>

            {/* §5.3: 6-digit code input (large, DM Mono, auto-advance) */}
            <View style={styles.codeRow}>
                {code.map((digit, i) => (
                    <View key={i} style={[styles.codeBox, digit !== '' && styles.codeBoxFilled]}>
                        <Text style={styles.codeDigit}>{digit}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.numPad}>
                {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']].map((row, ri) => (
                    <View key={ri} style={styles.numPadRow}>
                        {row.map((key) => (
                            <Pressable
                                key={key || `empty-${ri}`}
                                style={({ pressed }) => [
                                    styles.numPadKey,
                                    key === '' && styles.numPadKeyEmpty,
                                    pressed && key !== '' && styles.numPadKeyPressed,
                                ]}
                                onPress={() => {
                                    if (key === '⌫') handleDelete();
                                    else if (key !== '') handleDigitTap(key);
                                }}
                                disabled={key === ''}
                            >
                                <Text style={styles.numPadKeyText}>{key}</Text>
                            </Pressable>
                        ))}
                    </View>
                ))}
            </View>

            <View style={styles.bottomArea}>
                <Pressable style={styles.ghostButton} onPress={() => onComplete('')}>
                    <Text style={styles.ghostText}>Skip for now</Text>
                </Pressable>
            </View>
        </View>
    );
}

// ── Main Controller ────────────────────────────────────────
export default function OnboardingScreen() {
    const [step, setStep] = useState(0);
    const router = useRouter();
    const { settings, loading, updateSetting } = useSettings();
    const { pairWithDoctor } = useSupabase();
    const [pairingError, setPairingError] = useState('');

    React.useEffect(() => {
        if (!loading && settings.hasCompletedOnboarding) {
            setStep(4); // Jump directly to pairing screen if returning user
        }
    }, [loading, settings.hasCompletedOnboarding]);

    const handleComplete = async (code: string) => {
        try {
            if (code) {
                await pairWithDoctor(code);
                await updateSetting('pairingCode', code);
            }
            await updateSetting('hasCompletedOnboarding', true);
            router.replace('/(tabs)');
        } catch (e: any) {
            setPairingError(e.message || 'Invalid code');
            setStep(4); // stay on pairing screen
        }
    };

    const screens = [
        <WelcomeScreen key="welcome" onNext={() => setStep(1)} />,
        <HowItWorksScreen key="how" onNext={() => setStep(2)} onSkip={() => setStep(2)} />,
        <NotificationScreen key="notif" onNext={() => setStep(3)} />,
        <CheckInTimeScreen key="time" onNext={() => setStep(4)} />,
        <PairingCodeScreen key="pair" onComplete={handleComplete} errorMsg={pairingError} />,
    ];

    return <SafeAreaView style={styles.container}>{screens[step]}</SafeAreaView>;
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.fog,
    },
    screen: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing['2xl'],
        paddingBottom: Spacing.xl,
    },

    // ── Welcome ──
    welcomeHero: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    blob1: {
        position: 'absolute',
        top: '10%',
        right: -30,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: Colors.ice,
        opacity: 0.5,
        transform: [{ scaleX: 1.3 }, { rotate: '15deg' }],
    },
    blob2: {
        position: 'absolute',
        bottom: '15%',
        left: -40,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: Colors.aurora,
        opacity: 0.12,
        transform: [{ scaleX: 1.5 }],
    },
    blob3: {
        position: 'absolute',
        top: '30%',
        left: '20%',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.glacier,
        opacity: 0.06,
        transform: [{ scaleY: 1.4 }],
    },
    meetJennyTitle: {
        // §5.3: Canela 48px
        fontFamily: Fonts.display,
        fontSize: FontSizes['3xl'], // 48px
        color: Colors.ink,
        textAlign: 'center',
        lineHeight: FontSizes['3xl'] * 1.1,
        marginTop: Spacing.xl,
    },
    meetJennySubtitle: {
        // §5.3: Lora 18px
        fontFamily: Fonts.body,
        fontSize: 18,
        color: Colors.slate,
        textAlign: 'center',
        lineHeight: 18 * 1.5,
        marginTop: Spacing.sm,
    },

    // ── Centered hero (common) ──
    centeredHero: {
        alignItems: 'center',
        paddingTop: Spacing['3xl'],
    },
    heroTitle: {
        fontFamily: Fonts.displayBold,
        fontSize: FontSizes.lg,
        color: Colors.ink,
        textAlign: 'center',
        lineHeight: FontSizes.lg * 1.2,
        marginTop: Spacing.lg,
    },
    heroSubtitle: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.base,
        color: Colors.slate,
        textAlign: 'center',
        lineHeight: FontSizes.base * 1.5,
        marginTop: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },

    // ── Bottom ──
    bottomArea: {
        gap: Spacing.md,
    },
    ctaButton: {
        // §5.3: aurora-filled pill button
        backgroundColor: Colors.aurora,
        paddingVertical: 18,
        borderRadius: Radii.xl, // 28px
        alignItems: 'center',
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
    },
    ghostButton: {
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    ghostText: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.sm,
        color: Colors.slate,
    },
    skipButton: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.lg,
        zIndex: 10,
        padding: Spacing.sm,
    },
    skipText: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.sm,
        color: Colors.slate,
    },

    // ── Carousel ──
    carousel: { flexGrow: 0 },
    carouselPanel: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing['2xl'],
    },
    panelTitle: {
        fontFamily: Fonts.displayBold,
        fontSize: FontSizes.lg, // 24px
        color: Colors.ink,
        textAlign: 'center',
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    panelBody: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.base, // 16px min
        color: Colors.slate,
        textAlign: 'center',
        lineHeight: FontSizes.base * 1.5,
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.ice,
    },
    dotActive: {
        backgroundColor: Colors.glacier,
        width: 24,
    },

    // ── Time Picker ──
    timePickerArea: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
    },
    timePill: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radii.full,
        backgroundColor: Colors.snow,
        borderWidth: 2,
        borderColor: 'transparent',
        ...Shadows.card,
    },
    timePillSelected: {
        borderColor: Colors.glacier,
        backgroundColor: Colors.ice,
    },
    timePillText: {
        fontFamily: Fonts.monoMedium,
        fontSize: FontSizes.base,
        color: Colors.ink,
    },
    timePillTextSelected: {
        color: Colors.glacier,
    },

    // ── Pairing Code ──
    codeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginVertical: Spacing.xl,
    },
    codeBox: {
        width: 48,
        height: 60,
        borderRadius: Radii.md,
        backgroundColor: Colors.snow,
        borderWidth: 2,
        borderColor: 'rgba(28, 43, 58, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    codeBoxFilled: {
        borderColor: Colors.glacier,
        backgroundColor: Colors.ice,
    },
    codeDigit: {
        fontFamily: Fonts.monoMedium,
        fontSize: FontSizes.lg,
        color: Colors.ink,
    },
    numPad: {
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
    },
    numPadRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    numPadKey: {
        width: 72,
        height: 56,
        borderRadius: Radii.md,
        backgroundColor: Colors.snow,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.card,
    },
    numPadKeyEmpty: {
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
    },
    numPadKeyPressed: {
        backgroundColor: Colors.ice,
    },
    numPadKeyText: {
        fontFamily: Fonts.monoMedium,
        fontSize: FontSizes.md,
        color: Colors.ink,
    },
});
