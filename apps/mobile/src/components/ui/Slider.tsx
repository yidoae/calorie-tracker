import { useRef, useState } from "react";
import { StyleSheet, View, type AccessibilityActionEvent, type GestureResponderEvent } from "react-native";
import { colors, radius } from "@/theme";
import { dragIntent, stepValue, valueAt } from "./sliderGesture";

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

/**
 * A dumb horizontal slider on a 44 pt touch strip: drag sideways or tap the track. A touch changes
 * nothing until it is clearly a horizontal drag or a tap, so a vertical swipe still scrolls the
 * screen. Screen readers get an adjustable control with increment/decrement actions (one step
 * each). No native dependency: the View's own gesture responder.
 */
export default function Slider({ label, value, min, max, step, onChange, valueText, color = colors.ink, disabled = false }: Props) {
  const [width, setWidth] = useState(0);
  // Where the touch started, on the track and on the screen, and what the drag means so far.
  const drag = useRef({ trackX: 0, pageX: 0, pageY: 0, intent: "undecided" as ReturnType<typeof dragIntent> });

  function moveTo(x: number) {
    const next = valueAt(x, width, min, max, step);
    if (next !== value) onChange(next);
  }

  function onGrant(event: GestureResponderEvent) {
    // The thumb and fill ignore touches, so locationX is measured on the track strip. Later points
    // come from the page distance, which does not depend on the view under the finger.
    const { locationX, pageX, pageY } = event.nativeEvent;
    drag.current = { trackX: locationX, pageX, pageY, intent: "undecided" };
  }

  function onMove(event: GestureResponderEvent) {
    const dx = event.nativeEvent.pageX - drag.current.pageX;
    if (drag.current.intent === "undecided") drag.current.intent = dragIntent(dx, event.nativeEvent.pageY - drag.current.pageY);
    if (drag.current.intent === "slide") moveTo(drag.current.trackX + dx);
  }

  function onRelease() {
    if (drag.current.intent === "undecided") moveTo(drag.current.trackX);
  }

  function onAccessibilityAction(event: AccessibilityActionEvent) {
    if (disabled) return;
    const { actionName } = event.nativeEvent;
    if (actionName !== "increment" && actionName !== "decrement") return;
    const next = stepValue(value, actionName === "increment" ? 1 : -1, min, max, step);
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
      // Claim the touch at once so a tap can set the value, but change nothing until it is a tap or
      // a horizontal drag; until then the screen around it may take the touch and scroll.
      onStartShouldSetResponder={() => !disabled}
      onResponderTerminationRequest={() => drag.current.intent !== "slide"}
      onResponderGrant={onGrant}
      onResponderMove={onMove}
      onResponderRelease={onRelease}
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
