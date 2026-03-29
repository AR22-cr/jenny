/**
 * Scale5 (§5.5 — scale_5)
 * ────────────────────────
 * - 5 large circular tap targets in a row
 * - Option A: Jenny face variants (hand-drawn moods as placeholder text)
 * - Option B: Star fill (1–5), aurora color
 * - Anchors: "Not at all" / "Extremely"
 */
import { Colors, Fonts, FontSizes, Spacing } from '@/constants/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Frown, Meh, Smile, Star } from 'lucide-react-native';

const FACE_LABELS = ['Very low', 'Low', 'Okay', 'Good', 'Great'];

interface Props {
    value: number | null;
    onChange: (val: number) => void;
    variant?: 'faces' | 'stars';
}

export default function Scale5({ value, onChange, variant = 'faces' }: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {[1, 2, 3, 4, 5].map((n) => {
                    const isSelected = value === n;
                    const isFilledStar = variant === 'stars' && value !== null && n <= value;

                    const renderIcon = () => {
                        if (variant === 'faces') {
                            const color = isSelected ? Colors.glacier : Colors.ink;
                            const size = 28;
                            if (n === 1) return <Frown color={color} size={size} />;
                            if (n === 2) return <Frown color={color} size={size} opacity={0.5} />;
                            if (n === 3) return <Meh color={color} size={size} />;
                            if (n === 4) return <Smile color={color} size={size} opacity={0.5} />;
                            return <Smile color={color} size={size} />;
                        } else {
                            const color = isFilledStar || isSelected ? Colors.aurora : Colors.slate;
                            const fill = isFilledStar || isSelected ? Colors.aurora : 'transparent';
                            return <Star color={color} size={28} fill={fill} />;
                        }
                    };

                    return (
                        <Pressable
                            key={n}
                            style={[
                                styles.circle,
                                isSelected && styles.circleSelected,
                                isFilledStar && !isSelected && styles.circleFilled,
                            ]}
                            onPress={() => onChange(n)}
                        >
                            {renderIcon()}
                        </Pressable>
                    );
                })}
            </View>
            <View style={styles.anchors}>
                <Text style={styles.anchorText}>{FACE_LABELS[0]}</Text>
                <Text style={styles.anchorText}>{FACE_LABELS[4]}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    // §5.5: large circular tap targets
    circle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.snow,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(28, 43, 58, 0.06)',
    },
    circleSelected: {
        borderColor: Colors.glacier,
        backgroundColor: Colors.ice,
        transform: [{ scale: 1.12 }],
    },
    circleFilled: {
        borderColor: Colors.aurora,
        backgroundColor: 'rgba(232, 168, 124, 0.08)',
    },
    anchors: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: Spacing.xs,
    },
    anchorText: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.xs,
        color: Colors.slate,
    },
});
