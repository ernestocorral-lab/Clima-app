import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors } from '../theme/colors';

type WeatherIconKind =
  | 'clear'
  | 'mainlyClear'
  | 'partlyCloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder'
  | 'unknown';

type WeatherIconProps = {
  code: number;
  size?: number;
  color?: string;
  accentColor?: string;
};

function getWeatherIconKind(code: number): WeatherIconKind {
  if (code === 0) return 'clear';
  if (code === 1) return 'mainlyClear';
  if (code === 2) return 'partlyCloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code === 51 || code === 53 || code === 55 || code === 80) return 'drizzle';
  if (code === 61 || code === 63 || code === 65 || code === 81) return 'rain';
  if (code === 71 || code === 73 || code === 75) return 'snow';
  if (code === 82 || code === 95 || code === 96 || code === 99) return 'thunder';
  return 'unknown';
}

function Sun({ color }: { color: string }) {
  return (
    <>
      <Circle cx={12} cy={12} r={4.2} fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 12 + Math.cos(rad) * 6.2;
        const y1 = 12 + Math.sin(rad) * 6.2;
        const x2 = 12 + Math.cos(rad) * 8.4;
        const y2 = 12 + Math.sin(rad) * 8.4;
        return (
          <Line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
}

function Cloud({ color }: { color: string }) {
  return (
    <Path
      d="M7 15h10a3.5 3.5 0 0 0 .4-7A4.8 4.8 0 0 0 6.5 8.5 3.6 3.6 0 0 0 3 12.2 3.4 3.4 0 0 0 7 15Z"
      fill={color}
    />
  );
}

function Rain({ color, accentColor }: { color: string; accentColor: string }) {
  return (
    <>
      <Cloud color={color} />
      <Line x1={8} y1={17} x2={7} y2={20} stroke={accentColor} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1={12} y1={17} x2={11} y2={20} stroke={accentColor} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1={16} y1={17} x2={15} y2={20} stroke={accentColor} strokeWidth={1.4} strokeLinecap="round" />
    </>
  );
}

function Snow({ color, accentColor }: { color: string; accentColor: string }) {
  return (
    <>
      <Cloud color={color} />
      <Circle cx={9} cy={19} r={1.1} fill={accentColor} />
      <Circle cx={12} cy={20} r={1.1} fill={accentColor} />
      <Circle cx={15} cy={19} r={1.1} fill={accentColor} />
    </>
  );
}

function Thunder({ color, accentColor }: { color: string; accentColor: string }) {
  return (
    <>
      <Cloud color={color} />
      <Path d="M11 16.5 9.5 19h2.2l-1.3 2.5L14 17h-2.4l1.4-2.5Z" fill={accentColor} />
    </>
  );
}

function Fog({ color }: { color: string }) {
  return (
    <>
      <Line x1={5} y1={10} x2={19} y2={10} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={6} y1={13.5} x2={18} y2={13.5} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={7} y1={17} x2={17} y2={17} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </>
  );
}

function Unknown({ color }: { color: string }) {
  return (
    <>
      <Circle cx={12} cy={12} r={7.5} stroke={color} strokeWidth={1.5} fill="none" />
      <Line x1={12} y1={8.5} x2={12} y2={12.5} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={12} cy={15.5} r={0.9} fill={color} />
    </>
  );
}

export function WeatherIcon({
  code,
  size = 24,
  color = colors.textSecondary,
  accentColor = colors.accentSoft,
}: WeatherIconProps) {
  const kind = getWeatherIconKind(code);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {kind === 'clear' ? <Sun color={accentColor} /> : null}
      {kind === 'mainlyClear' ? (
        <>
          <Sun color={accentColor} />
          <Path d="M14 8h6a2.5 2.5 0 0 0 .2-5A3.4 3.4 0 0 0 16.5 5 2.6 2.6 0 0 0 14 7.2" fill={color} opacity={0.95} />
        </>
      ) : null}
      {kind === 'partlyCloudy' ? (
        <>
          <Sun color={accentColor} />
          <Path d="M13 10h7a2.8 2.8 0 0 0 .3-5.6A3.8 3.8 0 0 0 16 6.5 2.8 2.8 0 0 0 13 8.8" fill={color} />
          <Path d="M8 16h9a3.2 3.2 0 0 0 .3-6.4A4.2 4.2 0 0 0 11 8.5 3.2 3.2 0 0 0 8 11.6" fill={color} />
        </>
      ) : null}
      {kind === 'cloudy' ? <Cloud color={color} /> : null}
      {kind === 'fog' ? <Fog color={color} /> : null}
      {kind === 'drizzle' ? <Rain color={color} accentColor={accentColor} /> : null}
      {kind === 'rain' ? <Rain color={color} accentColor={accentColor} /> : null}
      {kind === 'snow' ? <Snow color={color} accentColor={accentColor} /> : null}
      {kind === 'thunder' ? <Thunder color={color} accentColor={colors.warning} /> : null}
      {kind === 'unknown' ? <Unknown color={color} /> : null}
    </Svg>
  );
}

export function getWeatherIconKindForCode(code: number): WeatherIconKind {
  return getWeatherIconKind(code);
}
