import type { ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';

type Props = {
  map: ReactNode;
  panel: ReactNode;
};

export function MapPanelLayout(props: Props) {
  const { height } = useWindowDimensions();
  const mapHeight = Math.max(260, Math.floor(height * 0.5));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: mapHeight }}>{props.map}</View>
      <View style={{ flex: 1 }}>{props.panel}</View>
    </View>
  );
}
