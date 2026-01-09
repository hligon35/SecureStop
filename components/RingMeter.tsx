import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

type Props = {
  value: number; // 0..1
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
};

export function RingMeter(props: Props) {
  const theme = useTheme();

  const size = props.size ?? 72;
  const strokeWidth = props.strokeWidth ?? 8;
  const value = clamp01(props.value);

  const rightRotation = value <= 0.5 ? value * 360 : 180;
  const leftRotation = value <= 0.5 ? 0 : (value - 0.5) * 360;

  const trackColor = theme.colors.surfaceVariant;
  const progressColor = theme.colors.primary;

  const radiusStyle = { width: size, height: size, borderRadius: size / 2 } as const;
  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: strokeWidth,
  } as const;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={[radiusStyle, { position: 'relative' }]}
      >
        {/* Track */}
        <View style={[circleStyle, { borderColor: trackColor }]} />

        {/* Right half */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: size / 2,
            height: size,
            overflow: 'hidden',
          }}
        >
          <View
            style={[
              circleStyle,
              {
                borderColor: progressColor,
                position: 'absolute',
                left: -size / 2,
                transform: [{ rotate: `${rightRotation}deg` }],
              },
            ]}
          />
        </View>

        {/* Left half */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size / 2,
            height: size,
            overflow: 'hidden',
          }}
        >
          <View
            style={[
              circleStyle,
              {
                borderColor: progressColor,
                position: 'absolute',
                left: 0,
                transform: [{ rotate: `${leftRotation}deg` }],
              },
            ]}
          />
        </View>

        {/* Center */}
        <View
          style={[
            radiusStyle,
            {
              position: 'absolute',
              top: strokeWidth,
              left: strokeWidth,
              width: size - strokeWidth * 2,
              height: size - strokeWidth * 2,
              borderRadius: (size - strokeWidth * 2) / 2,
              backgroundColor: theme.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
            },
          ]}
        >
          <Text variant="labelLarge">{Math.round(value * 100)}%</Text>
          {props.label ? <Text variant="labelSmall">{props.label}</Text> : null}
        </View>
      </View>

      {props.sublabel ? (
        <Text variant="labelSmall" style={{ marginTop: 6, color: theme.colors.onSurfaceVariant }}>
          {props.sublabel}
        </Text>
      ) : null}
    </View>
  );
}
