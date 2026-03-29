/**
 * History Screen — Apple Widget Style
 * ────────────────────────────────────
 * Scrollable list of past check-in sessions grouped by week.
 * Week groups use Apple Settings-style grouped cards.
 */
import Jenny from '@/components/Jenny';
import { Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme';
import { MOCK_DECK } from '@/data/mockDeck';
import { StoredCheckIn, useCheckInStorage } from '@/hooks/useStorage';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatWeek(weekStr: string): string {
    const d = new Date(weekStr + 'T12:00:00');
    const end = new Date(d);
    end.setDate(d.getDate() + 6);
    const mStart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const mEnd = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${mStart} – ${mEnd}`;
}

function CompletionRing({ answered, total }: { answered: number; total: number }) {
    const percent = total > 0 ? (answered / total) * 100 : 0;
    const ringColor = percent >= 100 ? Colors.moss : percent >= 50 ? Colors.glacier : Colors.slate;

    return (
        <View style={ringStyles.container}>
            <View style={ringStyles.track} />
            <View
                style={[
                    ringStyles.fill,
                    {
                        borderColor: ringColor,
                        borderTopColor: percent >= 25 ? ringColor : 'transparent',
                        borderRightColor: percent >= 50 ? ringColor : 'transparent',
                        borderBottomColor: percent >= 75 ? ringColor : 'transparent',
                        borderLeftColor: percent >= 100 ? ringColor : 'transparent' as any,
                    },
                ]}
            />
            <Text style={[ringStyles.text, { color: ringColor }]}>{Math.round(percent)}%</Text>
        </View>
    );
}

const ringStyles = StyleSheet.create({
    container: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    track: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 22,
        borderWidth: 3,
        borderColor: Colors.ice,
    },
    fill: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 22,
        borderWidth: 3,
    },
    text: {
        fontFamily: Fonts.monoMedium,
        fontSize: 11,
    },
});

// ── Detail Modal ──
function DetailModal({
    checkIn,
    visible,
    onClose,
}: {
    checkIn: StoredCheckIn | null;
    visible: boolean;
    onClose: () => void;
}) {
    if (!checkIn) return null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={detailStyles.container}>
                <View style={detailStyles.header}>
                    <Pressable onPress={onClose}>
                        <Text style={detailStyles.close}>Done</Text>
                    </Pressable>
                    <Text style={detailStyles.date}>{formatDate(checkIn.date)}</Text>
                </View>

                <ScrollView contentContainerStyle={detailStyles.content}>
                    <Text style={detailStyles.title}>Check-In Summary</Text>
                    <Text style={detailStyles.meta}>
                        {checkIn.questionsAnswered} of {checkIn.questionsTotal} answered
                    </Text>

                    <View style={detailStyles.groupedCard}>
                        {Object.entries(checkIn.answers).map(([qId, answer], idx, arr) => {
                            const question = MOCK_DECK.questions.find((q) => q.id === qId);
                            const displayAnswer = Array.isArray(answer)
                                ? answer.join(', ')
                                : typeof answer === 'boolean'
                                    ? answer ? 'Yes' : 'No'
                                    : String(answer);

                            return (
                                <View key={qId} style={[detailStyles.answerRow, idx < arr.length - 1 && detailStyles.answerRowBorder]}>
                                    <Text style={detailStyles.qText}>{question?.text ?? qId}</Text>
                                    <Text style={detailStyles.aText}>{displayAnswer}</Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const detailStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.fog },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    close: {
        fontFamily: Fonts.bodyBold,
        fontSize: FontSizes.base,
        color: Colors.glacier,
    },
    date: {
        fontFamily: Fonts.monoMedium,
        fontSize: FontSizes.sm,
        color: Colors.ink,
    },
    content: { padding: Spacing.lg, gap: Spacing.md },
    title: {
        fontFamily: Fonts.displayBold,
        fontSize: 22,
        color: Colors.ink,
        letterSpacing: -0.3,
    },
    meta: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.xs,
        color: Colors.slate,
        marginBottom: Spacing.sm,
    },
    groupedCard: {
        backgroundColor: Colors.snow,
        borderRadius: Radii.widget,
        overflow: 'hidden',
    },
    answerRow: {
        padding: Spacing.lg,
    },
    answerRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    qText: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.sm,
        color: Colors.slate,
        marginBottom: Spacing.xs,
    },
    aText: {
        fontFamily: Fonts.bodyBold,
        fontSize: FontSizes.base,
        color: Colors.ink,
    },
});

// ── Main History Screen ──
export default function HistoryScreen() {
    const { checkIns, loading, getCheckInsByWeek } = useCheckInStorage();
    const [selectedCheckIn, setSelectedCheckIn] = useState<StoredCheckIn | null>(null);

    const weeks = getCheckInsByWeek();
    const hasData = checkIns.length > 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerArea}>
                <Text style={styles.title}>History</Text>
            </View>

            {!hasData ? (
                <View style={styles.emptyArea}>
                    <View style={styles.emptyCard}>
                        <Jenny size={56} mood="curious" />
                        <Text style={styles.emptyTitle}>Nothing here yet</Text>
                        <Text style={styles.emptyBody}>
                            Your completed check-ins will appear here, grouped by week.
                        </Text>
                    </View>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {weeks.map(([weekKey, weekCheckIns]) => (
                        <View key={weekKey} style={styles.weekSection}>
                            <Text style={styles.weekLabel}>{formatWeek(weekKey)}</Text>
                            {/* Apple-style grouped card */}
                            <View style={styles.groupedCard}>
                                {weekCheckIns.map((c, idx) => (
                                    <Pressable
                                        key={c.id}
                                        style={({ pressed }) => [
                                            styles.checkInRow,
                                            idx < weekCheckIns.length - 1 && styles.checkInRowBorder,
                                            pressed && styles.checkInRowPressed,
                                        ]}
                                        onPress={() => setSelectedCheckIn(c)}
                                    >
                                        <View style={styles.rowLeft}>
                                            <Text style={styles.rowDate}>{formatDate(c.date)}</Text>
                                            <Text style={styles.rowMeta}>
                                                {c.questionsAnswered}/{c.questionsTotal} answered
                                            </Text>
                                        </View>
                                        <CompletionRing answered={c.questionsAnswered} total={c.questionsTotal} />
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            <DetailModal
                checkIn={selectedCheckIn}
                visible={selectedCheckIn !== null}
                onClose={() => setSelectedCheckIn(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.fog,
    },
    headerArea: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    title: {
        fontFamily: Fonts.displayBold,
        fontSize: 28,
        color: Colors.ink,
        letterSpacing: -0.5,
    },
    // Empty state
    emptyArea: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
    },
    emptyCard: {
        backgroundColor: Colors.snow,
        borderRadius: Radii.widget,
        padding: Spacing['2xl'],
        alignItems: 'center',
        gap: Spacing.md,
    },
    emptyTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: FontSizes.base,
        color: Colors.ink,
    },
    emptyBody: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.sm,
        color: Colors.slate,
        textAlign: 'center',
        lineHeight: FontSizes.sm * 1.5,
    },
    // List
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing['3xl'],
    },
    weekSection: {
        marginBottom: Spacing.lg,
    },
    weekLabel: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.xs,
        color: Colors.slate,
        letterSpacing: 1,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        paddingHorizontal: 4,
    },
    // Apple-style grouped card
    groupedCard: {
        backgroundColor: Colors.snow,
        borderRadius: Radii.widget,
        overflow: 'hidden',
    },
    checkInRow: {
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    checkInRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    checkInRowPressed: {
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    rowLeft: {
        flex: 1,
    },
    rowDate: {
        fontFamily: Fonts.bodyBold,
        fontSize: FontSizes.base,
        color: Colors.ink,
        marginBottom: 2,
    },
    rowMeta: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.xs,
        color: Colors.slate,
    },
});
