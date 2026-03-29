/**
 * Completion Screen (§5.5) — Celebratory
 * ────────────────────────────────────────
 * - Warm gradient background with floating orbs
 * - Jenny celebratory animation with breathing
 * - "All done for tonight." — Display serif
 * - "Back to Home" gradient button
 */
import Jenny from '@/components/Jenny';
import { Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSpring,
    withTiming,
    Easing,
} from 'react-native-reanimated';

export default function CompleteScreen() {
    const router = useRouter();

    const jennyScale = useSharedValue(0.6);
    const jennyRotate = useSharedValue(-8);
    const textOpacity = useSharedValue(0);
    const buttonOpacity = useSharedValue(0);
    const buttonTranslateY = useSharedValue(20);
    const orb1Y = useSharedValue(0);
    const orb2Y = useSharedValue(0);

    useEffect(() => {
        jennyScale.value = withSpring(1, { damping: 12, stiffness: 120 });
        jennyRotate.value = withSpring(0, { damping: 10, stiffness: 100 });
        textOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));
        buttonOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
        buttonTranslateY.value = withDelay(700, withSpring(0, { damping: 15, stiffness: 100 }));
        
        // Floating orbs
        orb1Y.value = withRepeat(
            withTiming(-10, { duration: 3000, easing: Easing.bezier(0.45, 0, 0.55, 1) }),
            -1, true
        );
        orb2Y.value = withDelay(1500, withRepeat(
            withTiming(8, { duration: 2500, easing: Easing.bezier(0.45, 0, 0.55, 1) }),
            -1, true
        ));
    }, []);

    const jennyStyle = useAnimatedStyle(() => ({
        transform: [{ scale: jennyScale.value }, { rotate: `${jennyRotate.value}deg` }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    const buttonStyle = useAnimatedStyle(() => ({
        opacity: buttonOpacity.value,
        transform: [{ translateY: buttonTranslateY.value }],
    }));

    const orb1Style = useAnimatedStyle(() => ({
        transform: [{ translateY: orb1Y.value }],
    }));

    const orb2Style = useAnimatedStyle(() => ({
        transform: [{ translateY: orb2Y.value }],
    }));

    return (
        <LinearGradient 
            colors={['#FFE0E8', '#FFEAEF', '#FBF5F3', '#FBF5F3']} 
            style={styles.gradient}
        >
            <SafeAreaView style={styles.container}>
                {/* Floating decorative orbs */}
                <Animated.View style={[styles.orb1, orb1Style]} />
                <Animated.View style={[styles.orb2, orb2Style]} />
                <Animated.View style={styles.orb3} />

                <View style={styles.content}>
                    <Animated.View style={jennyStyle}>
                        <Jenny size={120} mood="celebratory" animate={true} />
                    </Animated.View>

                    <Animated.View style={[styles.textArea, textStyle]}>
                        <Text style={styles.title}>All done for tonight.</Text>
                        <Text style={styles.subtitle}>
                            Jenny will see you tomorrow night.{'\n'}
                        </Text>
                    </Animated.View>

                    <Animated.View style={[styles.buttonArea, buttonStyle]}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.ctaOuter,
                                pressed && styles.ctaPressed,
                            ]}
                            onPress={() => router.replace('/(tabs)')}
                        >
                            <LinearGradient
                                colors={[Colors.glacier, '#E8568A', '#D4477A']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0.5 }}
                                style={styles.ctaButton}
                            >
                                <Text style={styles.ctaText}>Back to Home</Text>
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.xl,
    },
    textArea: {
        alignItems: 'center',
    },
    title: {
        fontFamily: Fonts.display,
        fontSize: FontSizes['2xl'],
        color: Colors.ink,
        textAlign: 'center',
        lineHeight: FontSizes['2xl'] * 1.1,
    },
    subtitle: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.base,
        color: Colors.slate,
        textAlign: 'center',
        lineHeight: FontSizes.base * 1.6,
        marginTop: Spacing.md,
    },
    buttonArea: {
        width: '100%',
        paddingTop: Spacing.md,
    },
    ctaOuter: {
        borderRadius: Radii.xl,
        shadowColor: Colors.glacier,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    },
    ctaButton: {
        height: 56,
        borderRadius: Radii.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaPressed: {
        opacity: 0.92,
        transform: [{ scale: 0.98 }],
    },
    ctaText: {
        fontFamily: Fonts.displayBold,
        fontSize: FontSizes.md,
        color: '#FFFFFF',
    },
    // Floating decorative orbs
    orb1: {
        position: 'absolute',
        top: 80,
        right: -30,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: Colors.aurora,
        opacity: 0.12,
    },
    orb2: {
        position: 'absolute',
        bottom: 120,
        left: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: Colors.glacier,
        opacity: 0.08,
    },
    orb3: {
        position: 'absolute',
        top: '45%' as any,
        left: '60%' as any,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFB8C9',
        opacity: 0.06,
    },
});
