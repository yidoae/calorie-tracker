import { useState } from "react";
import { StyleSheet, View, type AccessibilityActionEvent, type GestureResponderEvent } from "react-native";
import { colors, radius } from "@/theme";

interface Props {
  /** Read by screen readers; the visible label sits next to the slider. */
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Spoken value, e.g. "154 gram, 2,2 g/kg"; defaults to the number. */
  valueText?: string;
  /** Fill colour from the theme (colors.macroProtein, …); ink by default. */
  color?: string;
  disabled?: boolean;
}

const THUMB = 28;
const HEIGHT = 44;

const decimals = (step: number) => (String(step).split(".")[1] ?? "").length;

/** The value under a point on the track: snapped to the step and kept within min–max. */
function valueAt(x: number, width: number, min: number, max: number, step: number): number {
  const share = width > 0 ? Math.min(1, Math.max(0, x / width)) : 0;
  const snapped = min + Math.round((share * (max - min)) / step) * step;
  return Number(Math.min(max, Math.max(min, snapped)).toFixed(decimals(step)));
}

/**
 * A dumb horizontal slider on a 44 pt touch strip: drag or tap the track. Screen readers get an
 * adjustable control with increment/decrement actions (one step each). No native dependency: the
 * View's own gesture responder.
 */
export default function Slider({ label, value, min, max, step, onChange, valueText, color = colors.ink, disabled = false }: Props) {
  const [width, setWidth] = useState(0);

  // The thumb and fill ignore touches, so locationX is always measured on the track strip.
  function moveTo(event: GestureResponderEvent) {
    const next = valueAt(event.nativeEvent.locationX, width, min, max, step);
    if (next !== value) onChange(next);
  }

  function onAccessibilityAction(event: AccessibilityActionEvent) {
    if (disabled) return;
    const delta = event.nativeEvent.actionName === "increment" ? step : event.nativeEvent.actionName === "decrement" ? -step : 0;
    const next = Number(Math.min(max, Math.max(min, value + delta)).toFixed(decimals(step)));
    if (next !== value) onChange(next);
  }

  const share = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  const fill = disabled ? colors.fgSubtle : color;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: valueText }}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={onAccessibilityAction}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={styles.strip}
      onStartShouldSetResponder={() => !disabled}
      onMoveShouldSetResponder={() => !disabled}
      // Keep the drag when the screen around it would like to scroll.
      onResponderTerminationRequest={() => false}
      onResponderGrant={moveTo}
      onResponderMove={moveTo}
    >
      <View pointerEvents="none" style={styles.track}>
        <View style={[styles.fill, { width: `${share * 100}%`, backgroundColor: fill }]} />
      </View>
      <View pointerEvents="none" style={[styles.thumb, { left: share * width - THUMB / 2, borderColor: fill }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { height: HEIGHT, justifyContent: "center", marginHorizontal: THUMB / 2 },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surface3, overflow: "hidden" },
  fill: { height: 6 },
  thumb: {
    position: "absolute",
    top: (HEIGHT - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    backgroundColor: colors.surface,
  },
});
