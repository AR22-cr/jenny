/**
 * Sparkline — Compact SVG trend line
 * ───────────────────────────────────
 * Pure react-native-svg sparkline with filled area gradient.
 * No external chart library needed.
 */
import React from 'react';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

interface SparklineProps {
  values: number[];
  width: number;
  height: number;
  color: string;
  fillOpacity?: number;
}

export default function Sparkline({ values, width, height, color, fillOpacity = 0.15 }: SparklineProps) {
  if (!values || values.length < 2) return null;

  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // avoid division by zero

  // Map values to x,y coordinates
  const points = values.map((v, i) => ({
    x: padding + (i / (values.length - 1)) * w,
    y: padding + h - ((v - min) / range) * h,
  }));

  // Build smooth SVG path using cardinal spline approximation
  let linePath = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    linePath += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }

  // Closed area path for the fill
  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const areaPath = `${linePath} L ${lastPt.x},${height} L ${firstPt.x},${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Path d={areaPath} fill={`url(#spark-${color})`} />
      <Path d={linePath} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
