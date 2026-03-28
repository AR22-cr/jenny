/**
 * Completion Screen (§5.5)
 * ────────────────────────
 * - "All done for tonight." — Canela 36px → 2xl (40px closest on grid)
 * - "Pip will see you tomorrow night." or appointment text
 * - "Back to Home" glacier fill
 * - Pip celebratory animation
 */
import Pip from '@/components/Pip';
import { Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

export default function CompleteScreen() {
    const router = useRouter();

    const pipScale = useSharedValue(0.6);
    const pipRotate = useSharedValue(-8);
    const textOpacity = useSharedValue(0);
    const buttonOpacity = useSharedValue(0);

    useEffect(() => {
        pipScale.value = withSpring(1, { damping: 12, stiffness: 120 });
        pipRotate.value = withSpring(0, { damping: 10, stiffness: 100 });
        textOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));
        buttonOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    }, []);

    const pipStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pipScale.value }, { rotate: `${pipRotate.value}deg` }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    const buttonStyle = useAnimatedStyle(() => ({
        opacity: buttonOpacity.value,
    }));

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Animated.View style={pipStyle}>
                    <Pip size={120} mood="celebratory" />
                </Animated.View>

                <Animated.View style={[styles.textArea, textStyle]}>
                    {/* §5.5: Canela 36px → closest on 8pt grid is 2xl=40px */}
                    <Text style={styles.title}>All done for tonight.</Text>
                    <Text style={styles.subtitle}>
                        Pip will see you tomorrow night.{'\n'}
                    </Text>
                </Animated.View>

                <Animated.View style={[styles.buttonArea, buttonStyle]}>
                    {/* §5.5: "Back to Home" glacier fill */}
                    <Pressable
                        style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
                        onPress={() => router.replace('/(tabs)')}
                    >
                        <Text style={styles.ctaText}>Back to Home</Text>
                    </Pressable>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.fog,
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
    // §5.5: Canela 36px
    title: {
        fontFamily: Fonts.display,
        fontSize: FontSizes['2xl'], // 40px — closest 8pt grid value
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
    // §5.5: glacier fill
    ctaButton: {
        backgroundColor: Colors.glacier,
        height: 56,
        borderRadius: Radii.xl,
        alignItems: 'center',
        justifyContent: 'center',
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
});
