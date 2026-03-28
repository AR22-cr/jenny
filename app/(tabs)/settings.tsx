/**
 * Settings Screen (§5.1)
 * ──────────────────────
 * Notification time, preferences, account
 * Persisted via AsyncStorage
 */
import Pip from '@/components/Pip';
import { Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme';
import { useSettings } from '@/hooks/useSettings';
import { useCheckInStorage } from '@/hooks/useStorage';
import { useSupabase } from '@/hooks/useSupabase';
import { supabase } from '@/lib/supabase';
import { Heart } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const TIME_OPTIONS = [
    '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
    '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM',
];

function SettingsRow({
    label,
    value,
    onPress,
}: {
    label: React.ReactNode;
    value: React.ReactNode;
    onPress?: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [styles.row, onPress && pressed && styles.rowPressed]}
            onPress={onPress}
            disabled={!onPress}
        >
            <Text style={styles.rowLabel}>{label}</Text>
            <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{value}</Text>
                {onPress && <Text style={styles.rowChevron}>›</Text>}
            </View>
        </Pressable>
    );
}

function ToggleRow({
    label,
    value,
    onToggle,
}: {
    label: string;
    value: boolean;
    onToggle: () => void;
}) {
    return (
        <Pressable style={styles.row} onPress={onToggle}>
            <Text style={styles.rowLabel}>{label}</Text>
            <View style={[styles.toggle, value && styles.toggleOn]}>
                <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
            </View>
        </Pressable>
    );
}

export default function SettingsScreen() {
    const { settings, updateSetting } = useSettings();
    const { simulateHistory, syncing, pairWithDoctor, patientProfile, session, refreshDeck } = useSupabase();
    const { clearHistory } = useCheckInStorage();
    const [showTimePicker, setShowTimePicker] = useState(false);

    const paired = settings.pairingCode.length === 6;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerArea}>
                    <Text style={styles.title}>Settings</Text>
                    <Text style={styles.subtitle}>PREFERENCES</Text>
                </View>

                {/* Profile card */}
                <View style={styles.profileCard}>
                    <Pip size={56} mood="happy" />
                    <View style={styles.profileText}>
                        <Text style={styles.profileName}>Your PenguinPals</Text>
                        <Text style={styles.profileStatus}>
                            {paired 
                                ? (patientProfile?.doctors?.name 
                                    ? `Paired with ${patientProfile.doctors.name}` 
                                    : `Paired · ${settings.pairingCode}`)
                                : 'Not paired with a doctor'}
                        </Text>
                    </View>
                </View>

                {/* Check-in Preferences */}
                <Text style={styles.sectionLabel}>CHECK-IN</Text>
                <View style={styles.card}>
                    <SettingsRow
                        label="Check-in time"
                        value={settings.checkInTime}
                        onPress={() => setShowTimePicker(true)}
                    />
                    <View style={styles.divider} />
                    <ToggleRow
                        label="Notifications"
                        value={settings.notificationsEnabled}
                        onToggle={() => updateSetting('notificationsEnabled', !settings.notificationsEnabled)}
                    />
                </View>

                {/* Account */}
                <Text style={styles.sectionLabel}>ACCOUNT</Text>
                <View style={styles.card}>
                    <SettingsRow
                        label="Pairing Status"
                        value={paired ? 'Tap to unpair' : 'Tap to pair'}
                        onPress={() => {
                            if (paired) {
                                Alert.alert(
                                    'Already Paired', 
                                    'You are currently paired. Do you want to disconnect and reset the app?',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Unpair & Reset', style: 'destructive', onPress: async () => {
                                            await supabase.auth.signOut();
                                            updateSetting('pairingCode', '');
                                            Alert.alert('Reset', 'Your app has been successfully unpaired.');
                                        }}
                                    ]
                                );
                                return;
                            }
                            Alert.prompt(
                                'Pair with Doctor',
                                'Enter the 6-digit code provided by your doctor.',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Pair', onPress: async (code?: string) => {
                                        if (!code || code.trim().length !== 6) {
                                            Alert.alert('Error', 'Please enter a valid 6-character code.');
                                            return;
                                        }
                                        try {
                                            const secureCode = code.trim().toUpperCase();
                                            await pairWithDoctor(secureCode);
                                            updateSetting('pairingCode', secureCode);
                                            Alert.alert('Success', 'Successfully paired with your doctor!');
                                        } catch (e: any) {
                                            Alert.alert('Pairing Failed', e.message || 'Invalid code.');
                                        }
                                    }}
                                ],
                                'plain-text'
                            );
                        }}
                    />
                    <View style={styles.divider} />
                    <SettingsRow label="Version" value="1.0.0" />
                </View>

                {/* Developer Debug Section */}
                <View style={{ marginBottom: Spacing.xl }}>
                    <Text style={styles.sectionLabel}>DEVELOPER DEBUG</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowLabel}>Mock Device Time (Hour)</Text>
                                <Text style={[styles.rowValue, { marginTop: 2 }]}>Overrides the dynamic sky and check-in prompt</Text>
                            </View>
                            <Text style={[styles.rowValue, { color: Colors.ink }]}>
                                {settings.debugHourOverride !== null ? `${settings.debugHourOverride}:00` : 'Real Time'}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: Spacing.lg, paddingTop: 0 }}>
                            {[null, 8, 14, 21].map((h) => {
                                const label = h === null ? 'Off' : h === 8 ? '8 AM' : h === 14 ? '2 PM' : '9 PM';
                                const active = settings.debugHourOverride === h;
                                return (
                                    <Pressable 
                                        key={h?.toString() || 'null'} 
                                        style={[
                                            styles.ghostButton, 
                                            { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
                                            active && { backgroundColor: Colors.glacier, borderColor: Colors.glacier }
                                        ]}
                                        onPress={() => updateSetting('debugHourOverride', h)}
                                    >
                                        <Text style={[styles.ghostBtnText, active && { color: '#FFF' }]}>{label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }}>
                            <Text style={styles.rowLabel}>Mock Device Date (Days Offset)</Text>
                            <Text style={[styles.rowValue, { marginTop: 2, marginBottom: Spacing.md }]}>Simulate future check-ins</Text>
                            
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                                <Pressable style={[styles.ghostButton, { flex: 1 }]} onPress={() => updateSetting('debugDateOffset', settings.debugDateOffset - 1)}>
                                    <Text style={styles.ghostBtnText}>- 1 Day</Text>
                                </Pressable>
                                <Text style={[styles.rowLabel, { minWidth: 60, textAlign: 'center' }]}>
                                    {settings.debugDateOffset > 0 ? '+' : ''}{settings.debugDateOffset} Days
                                </Text>
                                <Pressable style={[styles.ghostButton, { flex: 1 }]} onPress={() => updateSetting('debugDateOffset', settings.debugDateOffset + 1)}>
                                    <Text style={styles.ghostBtnText}>+ 1 Day</Text>
                                </Pressable>
                                <Pressable style={[styles.ghostButton, { flex: 1, backgroundColor: Colors.ice, borderColor: Colors.ice }]} onPress={() => updateSetting('debugDateOffset', 0)}>
                                    <Text style={[styles.ghostBtnText, { color: Colors.glacier }]}>Reset</Text>
                                </Pressable>
                            </View>
                        </View>
                        <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }}>
                            <Text style={[styles.rowLabel, { marginBottom: Spacing.sm }]}>Data Spoofing</Text>
                            <Pressable 
                                style={[
                                    styles.ghostButton, 
                                    { backgroundColor: Colors.aurora, borderColor: Colors.aurora }
                                ]}
                                onPress={async () => {
                                    Alert.alert(
                                        "Simulate History", 
                                        "This will generate 30 days of random historical check-in data. Continue?",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Simulate", onPress: async () => {
                                                try {
                                                    await simulateHistory(30);
                                                    Alert.alert("Success", "Generated 30 days of data!");
                                                } catch(e: any) {
                                                    Alert.alert("Error", e.message);
                                                }
                                            } }
                                        ]
                                    );
                                }}
                                disabled={syncing}
                            >
                                <Text style={[styles.ghostBtnText, { color: '#FFF', fontFamily: Fonts.bodyBold }]}>
                                    {syncing ? 'GENERATING...' : 'SIMULATE 30 DAYS'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* About */}
                <Text style={styles.sectionLabel}>ABOUT</Text>
                <View style={styles.card}>
                    <SettingsRow label="Privacy Policy" value="" onPress={() => { }} />
                    <View style={styles.divider} />
                    <SettingsRow label="Terms of Service" value="" onPress={() => { }} />
                    <View style={styles.divider} />
                    <SettingsRow 
                        label={
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.rowLabel}>Made with</Text>
                                <Heart size={16} color={Colors.blush} />
                            </View>
                        } 
                        value="" 
                    />
                </View>
            </ScrollView>

            {/* Time Picker Modal */}
            <Modal visible={showTimePicker} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Pressable onPress={() => setShowTimePicker(false)}>
                            <Text style={styles.modalClose}>✕ Close</Text>
                        </Pressable>
                        <Text style={styles.modalTitle}>Check-In Time</Text>
                        <View style={{ width: 60 }} />
                    </View>

                    <View style={styles.timeGrid}>
                        {TIME_OPTIONS.map((time) => (
                            <Pressable
                                key={time}
                                style={[
                                    styles.timePill,
                                    settings.checkInTime === time && styles.timePillSelected,
                                ]}
                                onPress={() => {
                                    updateSetting('checkInTime', time);
                                    setShowTimePicker(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.timePillText,
                                        settings.checkInTime === time && styles.timePillTextSelected,
                                    ]}
                                >
                                    {time}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.fog },
    content: { paddingBottom: Spacing['3xl'] },

    headerArea: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.lg,
    },
    title: {
        fontFamily: Fonts.displayBold,
        fontSize: FontSizes.xl,
        color: Colors.ink,
        lineHeight: FontSizes.xl * 1.1,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontFamily: Fonts.monoMedium,
        fontSize: FontSizes.xs,
        color: Colors.slate,
        letterSpacing: 2,
    },

    // Profile
    profileCard: {
        backgroundColor: Colors.snow,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        ...Shadows.card,
    },
    profileText: { flex: 1 },
    profileName: {
        fontFamily: Fonts.bodyBold,
        fontSize: FontSizes.base,
        color: Colors.ink,
    },
    profileStatus: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.xs,
        color: Colors.slate,
        marginTop: 2,
    },

    // Section labels
    sectionLabel: {
        fontFamily: Fonts.monoMedium,
        fontSize: FontSizes.xs,
        color: Colors.slate,
        letterSpacing: 2,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
        marginTop: Spacing.sm,
    },

    // Card
    card: {
        backgroundColor: Colors.snow,
        borderRadius: Radii.lg,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.card,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(28, 43, 58, 0.04)',
        marginHorizontal: Spacing.lg,
    },

    // Rows
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        minHeight: 56,
    },
    rowPressed: { opacity: 0.7 },
    rowLabel: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.base,
        color: Colors.ink,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    rowValue: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.sm,
        color: Colors.glacier,
    },
    rowChevron: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.md,
        color: Colors.slate,
    },

    // Toggle
    toggle: {
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.ice,
        padding: 3,
        justifyContent: 'center',
    },
    toggleOn: {
        backgroundColor: Colors.glacier,
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.snow,
        ...Shadows.card,
    },
    toggleThumbOn: {
        alignSelf: 'flex-end',
    },

    // Modal
    modalContainer: { flex: 1, backgroundColor: Colors.fog },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    modalClose: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.sm,
        color: Colors.slate,
    },
    modalTitle: {
        fontFamily: Fonts.displayBold,
        fontSize: FontSizes.md,
        color: Colors.ink,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
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
    ghostButton: {
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(28, 43, 58, 0.1)',
        borderRadius: Radii.md,
    },
    ghostBtnText: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.sm,
        color: Colors.slate,
    },
    debugCard: {
        backgroundColor: Colors.snow,
        padding: Spacing.lg,
        borderRadius: Radii.lg,
        ...Shadows.card,
    },
    debugValueText: {
        fontFamily: Fonts.monoMedium,
        fontSize: FontSizes.sm,
        color: Colors.glacier,
    },
});
