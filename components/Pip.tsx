/**
 * Pip Vector Engine
 * ─────────────────────────
 * Parametric SVG representation of the Pip the Penguin mascot.
 * Supports dynamic rendering of 14 distinct emotions entirely through
 * local vector path mathematics, guaranteeing zero-load resolution scaling.
 */
import { Colors, Fonts, FontSizes, Spacing } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Ellipse, G } from 'react-native-svg';

export type PipMood = 
  | 'happy' | 'curious' | 'sleepy' | 'celebratory' | 'concerned' | 'neutral'
  | 'Calm' | 'Hopeful' | 'Tired' | 'Restless' | 'Sad' | 'Anxious' | 'Irritable' | 'Frustrated';

interface PipProps {
    size?: number;
    mood?: PipMood;
    showLabel?: boolean;
}

export default function Pip({ size = 80, mood = 'neutral', showLabel = false }: PipProps) {
    const normalizedMood = mood.toLowerCase();

    // Base Frame
    const drawBody = () => <Circle cx="50" cy="50" r="50" fill={Colors.ink} />;
    
    // Classic Penguin Widow-Peak Face Plate
    const drawFacePlate = () => (
        <Path 
            d="M15,60 C15,30 35,20 50,40 C65,20 85,30 85,60 C85,85 70,95 50,95 C30,95 15,85 15,60 Z" 
            fill={Colors.snow} 
        />
    );

    // ── Vector Trait Library ──
    const EyeCircle = ({ cx, cy }: { cx: number, cy: number }) => <Circle cx={cx} cy={cy} r="4" fill={Colors.ink} />;
    const EyeClosedUp = ({ cx, cy }: { cx: number, cy: number }) => <Path d={`M${cx-5},${cy} Q${cx},${cy-6} ${cx+5},${cy}`} stroke={Colors.ink} strokeWidth="3" strokeLinecap="round" fill="none" />;
    const EyeClosedDown = ({ cx, cy }: { cx: number, cy: number }) => <Path d={`M${cx-5},${cy} Q${cx},${cy+6} ${cx+5},${cy}`} stroke={Colors.ink} strokeWidth="3" strokeLinecap="round" fill="none" />;
    const EyeFlat = ({ cx, cy }: { cx: number, cy: number }) => <Path d={`M${cx-5},${cy} L${cx+5},${cy}`} stroke={Colors.ink} strokeWidth="3" strokeLinecap="round" />;
    const EyeAngryL = ({ cx, cy }: { cx: number, cy: number }) => <Path d={`M${cx-6},${cy-3} L${cx+4},${cy+2}`} stroke={Colors.ink} strokeWidth="3" strokeLinecap="round" />;
    const EyeAngryR = ({ cx, cy }: { cx: number, cy: number }) => <Path d={`M${cx-4},${cy+2} L${cx+6},${cy-3}`} stroke={Colors.ink} strokeWidth="3" strokeLinecap="round" />;
    const EyeX = ({ cx, cy }: { cx: number, cy: number }) => (
        <G>
            <Path d={`M${cx-4},${cy-4} L${cx+4},${cy+4}`} stroke={Colors.ink} strokeWidth="3" strokeLinecap="round" />
            <Path d={`M${cx-4},${cy+4} L${cx+4},${cy-4}`} stroke={Colors.ink} strokeWidth="3" strokeLinecap="round" />
        </G>
    );

    // ── Beak Library ──
    const BeakNormal = () => <Ellipse cx="50" cy="58" rx="8" ry="4.5" fill={Colors.aurora} />;
    const BeakSmile = () => <Path d="M42,56 Q50,65 58,56 L50,66 Z" fill={Colors.aurora} />;
    const BeakSad = () => <Path d="M42,62 Q50,53 58,62 L50,64 Z" fill={Colors.aurora} />;
    const BeakOpen = () => <Ellipse cx="50" cy="60" rx="6" ry="7" fill={Colors.aurora} />;

    // ── Accessory Engine ──
    const Accessories = () => {
        if (normalizedMood === 'anxious' || normalizedMood === 'concerned') {
            return (
                <Path d="M68,26 C66,32 74,32 72,26 C72,22 68,22 68,26 Z" fill={Colors.glacier} /> 
            );
        }
        if (normalizedMood === 'sleepy' || normalizedMood === 'tired') {
            return (
                <G stroke={Colors.slate} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <Path d="M68,28 L74,28 L68,34 L74,34" />
                    <Path d="M78,18 L82,18 L78,22 L82,22" />
                </G>
            );
        }
        if (normalizedMood === 'frustrated') {
            return (
                <G fill="rgba(244, 63, 94, 0.2)">
                    <Circle cx="30" cy="56" r="6" />
                    <Circle cx="70" cy="56" r="6" />
                </G>
            );
        }
        return null;
    };

    const renderFaceDetails = () => {
        switch (normalizedMood) {
            case 'calm':
            case 'sleepy':
                return <><EyeClosedDown cx={35} cy={46} /><EyeClosedDown cx={65} cy={46} /><BeakNormal /></>;
            case 'hopeful':
            case 'happy':
            case 'celebratory':
                return <><EyeClosedUp cx={34} cy={45} /><EyeClosedUp cx={66} cy={45} /><BeakSmile /></>;
            case 'tired':
                return <><EyeFlat cx={35} cy={46} /><EyeFlat cx={65} cy={46} /><BeakNormal /><EyeClosedDown cx={35} cy={51} /><EyeClosedDown cx={65} cy={51} /></>; 
            case 'neutral':
                return <><EyeCircle cx={35} cy={45} /><EyeCircle cx={65} cy={45} /><BeakNormal /></>;
            case 'restless':
            case 'curious':
                return <><Circle cx={34} cy={45} r="6" fill={Colors.ink}/><Circle cx={33} cy={44} r="2" fill={Colors.snow}/><Circle cx={66} cy={45} r="5" fill={Colors.ink}/><BeakOpen /></>;
            case 'sad':
                return <><EyeCircle cx={35} cy={49} /><EyeCircle cx={65} cy={49} /><BeakSad /></>;
            case 'anxious':
                return <><Circle cx={35} cy={45} r="2.5" fill={Colors.ink}/><Circle cx={65} cy={45} r="2.5" fill={Colors.ink}/><BeakNormal /></>;
            case 'irritable':
                return <><EyeAngryL cx={35} cy={46} /><EyeAngryR cx={65} cy={46} /><BeakNormal /></>;
            case 'frustrated':
                return <><EyeX cx={35} cy={46} /><EyeX cx={65} cy={46} /><BeakSad /></>;
            default:
                return <><EyeCircle cx={35} cy={45} /><EyeCircle cx={65} cy={45} /><BeakNormal /></>;
        }
    };

    return (
        <View style={[styles.container, { width: size, height: showLabel ? size + 24 : size }]}>
            <Svg width={size} height={size} viewBox="0 0 100 100">
                {drawBody()}
                {drawFacePlate()}
                {renderFaceDetails()}
                <Accessories />
            </Svg>
            {showLabel && <Text style={styles.label}>Pip</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontFamily: Fonts.monoMedium,
        fontSize: FontSizes.xs,
        color: Colors.slate,
        marginTop: Spacing.xs,
        position: 'absolute',
        bottom: 0,
    },
});
