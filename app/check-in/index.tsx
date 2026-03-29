/**
 * Check-In Flow (§5.5)
 * ─────────────────────
 * Full-screen modal, question-by-question:
 * - Header: "Check-In · [Day], [Date]" DM Mono 13px slate
 * - Progress bar: thin line, glacier fill
 * - Question number: "2 of 8" DM Mono, top-left
 * - Question text: Canela 24px, centered, max 2 lines
 * - "Next →": glacier fill, full-width, 56px tall
 * - "← Back" ghost link top-left
 * - "Skip" 14px slate, bottom-center (non-required only)
 * - "Done in ~2 min" duration estimate
 */
import Jenny from '@/components/Jenny';
import { Animation, Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme';
import { Question } from '@/shared/types';
import { useCheckInStorage } from '@/hooks/useStorage';
import { useSupabase } from '@/hooks/useSupabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import Frequency from '@/components/questions/Frequency';
import MoodGrid from '@/components/questions/MoodGrid';
import MultiChoice from '@/components/questions/MultiChoice';
import MultiSelect from '@/components/questions/MultiSelect';
import Scale10 from '@/components/questions/Scale10';
import Scale5 from '@/components/questions/Scale5';
import Scale7 from '@/components/questions/Scale7';
import TextShort from '@/components/questions/TextShort';
import YesNo from '@/components/questions/YesNo';
import Duration from '@/components/questions/Duration';

export default function CheckInScreen() {
    const router = useRouter();
    const { addCheckIn, getSimulatedDate } = useCheckInStorage();
    const { activeDeck, submitResponse, createCheckInSession } = useSupabase();
    
    const questions = activeDeck?.questions || [];
    const total = questions.length;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [sessionId, setSessionId] = useState<string | null>(null);
    const question = questions[currentIndex];

    // Initialize check-in session with Supabase
    useEffect(() => {
        if (total > 0 && !sessionId) {
            createCheckInSession(total).then(setSessionId);
        }
    }, [total, sessionId, createCheckInSession]);

    const opacity = useSharedValue(1);
    const translateY = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    const animateTransition = (direction: 'forward' | 'back', callback: () => void) => {
        const target = direction === 'forward' ? -16 : 16;
        opacity.value = withTiming(0, { duration: 120 });
        translateY.value = withTiming(target, { duration: 120 });

        setTimeout(() => {
            callback();
            translateY.value = direction === 'forward' ? 16 : -16;
            opacity.value = withTiming(1, { duration: Animation.standard });
            translateY.value = withTiming(0, { duration: Animation.standard });
        }, 150);
    };

    const setAnswer = (value: any) => {
        setAnswers((prev) => ({ ...prev, [question.id]: value }));
    };

    const goNext = async () => {
        if (!sessionId) return; // safeguard

        // Push response to Supabase queue
        await submitResponse(question.id, currentAnswer, !hasAnswer, sessionId);

        if (currentIndex < total - 1) {
            animateTransition('forward', () => setCurrentIndex((i) => i + 1));
        } else {
            // Save check-in locally for streak display history
            await addCheckIn(answers, total);
            router.replace('/check-in/complete');
        }
    };

    const goBack = () => {
        if (currentIndex > 0) {
            animateTransition('back', () => setCurrentIndex((i) => i - 1));
        }
    };

    const currentAnswer = question ? answers[question.id] : undefined;
    const hasAnswer = currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '';
    const progress = total > 0 ? (currentIndex + (hasAnswer ? 1 : 0)) / total : 0;

    // Determine Jenny mood from answer context
    const getPipMood = () => {
        if (!hasAnswer || !question) return 'neutral' as const;
        if (question.type === 'scale_10' && typeof currentAnswer === 'number' && currentAnswer >= 7)
            return 'concerned' as const;
        return 'happy' as const;
    };

    const dateStr = getSimulatedDate().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    if (!activeDeck || questions.length === 0 || !question) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }]}>
                <Jenny size={64} mood="neutral" />
                <Text style={[styles.questionText, { textAlign: 'center', marginTop: Spacing.xl, fontSize: 20 }]}>
                    No Questions Yet
                </Text>
                <Text style={[styles.durationHint, { marginBottom: Spacing.xl, fontSize: 14 }]}>
                    Your doctor hasn't added any specific questions to your deck. Check back later!
                </Text>
                <Pressable onPress={() => router.back()} style={styles.nextButton}>
                    <Text style={styles.nextText}>Go Back</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* §5.5: Header */}
            <View style={styles.header}>
                {currentIndex > 0 ? (
                    <Pressable onPress={goBack} style={styles.backButton}>
                        <Text style={styles.backText}>← Back</Text>
                    </Pressable>
                ) : (
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backText}>✕ Close</Text>
                    </Pressable>
                )}

                <View style={styles.headerRight}>
                    {/* §5.5: Jenny small, top-right, reacting to answers */}
                    <Jenny size={32} mood={getPipMood()} />
                    {/* §5.5: "Check-In · [Day], [Date]" DM Mono 13px slate */}
                    <Text style={styles.headerLabel}>Check-In · {dateStr}</Text>
                </View>
            </View>

            {/* §5.5: Progress bar — gradient fill */}
            <View style={styles.progressTrack}>
                <Animated.View style={[{ width: `${progress * 100}%`, height: '100%' }]}>
                    <LinearGradient
                        colors={[Colors.glacier, Colors.aurora]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1, borderRadius: 2 }}
                    />
                </Animated.View>
            </View>

            {/* §5.5: "Done in ~2 min" */}
            <Text style={styles.durationHint}>Done in ~{Math.ceil(total / 3)} min</Text>

            {/* Question Area */}
            <ScrollView
                contentContainerStyle={styles.questionArea}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Animated.View style={[styles.questionContent, animatedStyle]}>
                    {/* §5.5: "2 of 8" DM Mono, top-left */}
                    <Text style={styles.questionNumber}>{currentIndex + 1} of {total}</Text>

                    {/* §5.5: Canela 24px, centered */}
                    <Text style={styles.questionText}>{question.text}</Text>

                    <View style={styles.answerArea}>
                        {renderQuestion(question, currentAnswer, setAnswer)}
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                {/* §5.5: "Skip" 14px slate, non-required only */}
                {!question.is_required && (
                    <Pressable onPress={goNext} style={styles.skipButton}>
                        <Text style={styles.skipText}>Skip</Text>
                    </Pressable>
                )}

                {/* §5.5: "Next →" gradient fill, full-width, 56px tall */}
                <Pressable
                    style={({ pressed }) => [
                        styles.nextOuter,
                        question.is_required && !hasAnswer && styles.nextButtonDisabled,
                        pressed && !(question.is_required && !hasAnswer) && { transform: [{ scale: 0.98 }], opacity: 0.92 },
                    ]}
                    onPress={goNext}
                    disabled={question.is_required && !hasAnswer}
                >
                    <LinearGradient
                        colors={[Colors.glacier, '#E8568A', '#D4477A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.nextButton}
                    >
                        <Text style={styles.nextText}>
                            {currentIndex === total - 1 ? 'Finish' : 'Next →'}
                        </Text>
                    </LinearGradient>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

function renderQuestion(question: Question, value: any, onChange: (val: any) => void) {
    switch (question.type) {
        case 'yes_no':
            return <YesNo value={value ?? null} onChange={onChange} />;
        case 'scale_5':
            return <Scale5 value={value ?? null} onChange={onChange} variant={question.config.variant as any} />;
        case 'scale_7':
            return <Scale7 value={value ?? null} onChange={onChange} anchorLow={question.config.anchorLow} anchorHigh={question.config.anchorHigh} />;
        case 'scale_10':
            return <Scale10 value={value ?? null} onChange={onChange} anchorLow={question.config.anchorLow} anchorHigh={question.config.anchorHigh} />;
        case 'multi_choice':
            return <MultiChoice value={value ?? null} onChange={onChange} options={question.config.options || []} />;
        case 'multi_select':
            return <MultiSelect value={value ?? []} onChange={onChange} options={question.config.options || []} />;
        case 'frequency':
            return <Frequency value={value ?? null} onChange={onChange} />;
        case 'mood_grid':
            return <MoodGrid value={value ?? null} onChange={onChange} />;
        case 'text_short':
            return <TextShort value={value ?? ''} onChange={onChange} />;
        case 'duration':
            return <Duration value={value ?? null} onChange={onChange} />;
        default:
            return <Text style={{ color: Colors.slate }}>Unsupported: {question.type}</Text>;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.fog,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    backButton: {
        paddingVertical: Spacing.xs,
        paddingRight: Spacing.md,
    },
    // §5.5: "← Back" ghost link
    backText: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.sm,
        color: Colors.slate,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    // §5.5: DM Mono 13px slate
    headerLabel: {
        fontFamily: Fonts.mono,
        fontSize: 13,
        color: Colors.slate,
        letterSpacing: 0.3,
    },
    progressTrack: {
        height: 3,
        backgroundColor: Colors.ice,
        marginHorizontal: Spacing.lg,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.glacier,
        borderRadius: 2,
    },
    // §5.5: "Done in ~2 min"
    durationHint: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.xs,
        color: Colors.slate,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    questionArea: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.lg,
    },
    questionContent: {
        flex: 1,
    },
    // §5.5: "2 of 8" DM Mono
    questionNumber: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.sm,
        color: Colors.slate,
        marginBottom: Spacing.md,
    },
    // §5.5: Canela 24px
    questionText: {
        fontFamily: Fonts.displayBold,
        fontSize: FontSizes.lg, // 24px
        color: Colors.ink,
        lineHeight: FontSizes.lg * 1.3,
        marginBottom: Spacing.xl,
    },
    answerArea: {
        alignItems: 'center',
    },
    bottomBar: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        paddingBottom: Spacing.xl,
        gap: Spacing.sm,
        alignItems: 'center',
    },
    skipButton: {
        paddingVertical: Spacing.xs,
    },
    // §5.5: "Skip" 14px slate
    skipText: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.sm,
        color: Colors.slate,
    },
    // §5.5: glacier gradient fill, full-width, 56px tall
    nextOuter: {
        borderRadius: Radii.xl,
        width: '100%',
        overflow: 'hidden',
        shadowColor: Colors.glacier,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    nextButton: {
        height: 56,
        borderRadius: Radii.xl,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    nextButtonDisabled: {
        opacity: 0.35,
    },
    nextText: {
        fontFamily: Fonts.displayBold,
        fontSize: FontSizes.md,
        color: '#FFFFFF',
    },
});
