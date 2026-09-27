// Pati SOS çizimleri — logo diliyle aynı: yuvarlak, düz renk, teal + mercan + bal.
// Karşılama slaytları, ana sayfa bannerları ve boş durumlarda kullanılır.
import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect, Defs, ClipPath } from 'react-native-svg';
import { useTheme, palette, type Theme } from '@/lib/theme';

export type ArtName = 'emergency' | 'petcard' | 'community' | 'vet' | 'heat' | 'vaccine' | 'shield' | 'chat';

interface Colors {
  blob: string;
  blobAlt: string;
  surface: string;
  line: string;
  text: string;
  device: string;
  deviceEdge: string;
  primary: string;
  primaryDeep: string;
  coral: string;
  coralSoft: string;
  honey: string;
  honeySoft: string;
  white: string;
  shadow: string;
}

function colors(t: Theme, onColor: boolean): Colors {
  const base: Colors = t.dark
    ? {
        blob: 'rgba(63,184,165,0.13)',
        blobAlt: 'rgba(242,100,75,0.13)',
        surface: palette.night[700],
        line: palette.night[500],
        text: '#E6E1D8',
        device: '#0A0F0E',
        deviceEdge: palette.night[500],
        primary: palette.teal[400],
        primaryDeep: palette.teal[500],
        coral: palette.coral[500],
        coralSoft: 'rgba(242,100,75,0.24)',
        honey: palette.honey[500],
        honeySoft: 'rgba(233,169,58,0.14)',
        white: '#F3F0EA',
        shadow: 'rgba(0,0,0,0.35)',
      }
    : {
        blob: palette.teal[100],
        blobAlt: palette.coral[100],
        surface: '#FFFFFF',
        line: palette.cream[300],
        text: palette.ink[900],
        device: palette.ink[900],
        deviceEdge: palette.ink[700],
        primary: palette.teal[700],
        primaryDeep: palette.teal[800],
        coral: palette.coral[600],
        coralSoft: palette.coral[100],
        honey: palette.honey[500],
        honeySoft: palette.honey[100],
        white: '#FFFFFF',
        shadow: 'rgba(59,47,34,0.10)',
      };
  if (onColor) {
    // Renkli banner zemininde: arka plan lekesi beyaz tül, yüzeyler beyaz
    return {
      ...base,
      blob: 'rgba(255,255,255,0.14)',
      blobAlt: 'rgba(255,255,255,0.14)',
      surface: '#FFFFFF',
      line: palette.cream[300],
      text: palette.ink[900],
      primary: palette.teal[700],
      primaryDeep: palette.teal[800],
      coralSoft: palette.coral[100],
      honeySoft: 'rgba(255,255,255,0.14)',
      shadow: 'rgba(0,0,0,0.12)',
    };
  }
  return base;
}

// ─── Ortak parçalar ──────────────────────────────────────────────────────────
function Paw({ x, y, s = 1, rot = 0, fill, opacity = 1 }: { x: number; y: number; s?: number; rot?: number; fill: string; opacity?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={opacity}>
      <Path
        d="M0 1.6 C-4 1.6 -6.6 4.6 -6.6 7.4 C-6.6 9.8 -4.7 10.9 -2.7 10.5 C-1.4 10.2 -0.7 9.8 0 9.8 C0.7 9.8 1.4 10.2 2.7 10.5 C4.7 10.9 6.6 9.8 6.6 7.4 C6.6 4.6 4 1.6 0 1.6 Z"
        fill={fill}
      />
      <Ellipse cx={-7.2} cy={-2.6} rx={2.5} ry={3.2} fill={fill} transform="rotate(-22 -7.2 -2.6)" />
      <Ellipse cx={-2.6} cy={-6.2} rx={2.6} ry={3.4} fill={fill} transform="rotate(-7 -2.6 -6.2)" />
      <Ellipse cx={2.6} cy={-6.2} rx={2.6} ry={3.4} fill={fill} transform="rotate(7 2.6 -6.2)" />
      <Ellipse cx={7.2} cy={-2.6} rx={2.5} ry={3.2} fill={fill} transform="rotate(22 7.2 -2.6)" />
    </G>
  );
}

function Heart({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <Path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 5 C-5 1.6 -7 -1 -7 -3.4 C-7 -5.6 -5.4 -7.2 -3.4 -7.2 C-1.9 -7.2 -0.8 -6.3 0 -5 C0.8 -6.3 1.9 -7.2 3.4 -7.2 C5.4 -7.2 7 -5.6 7 -3.4 C7 -1 5 1.6 0 5 Z"
      fill={fill}
    />
  );
}

function Sparkle({ x, y, r, fill, opacity = 1 }: { x: number; y: number; r: number; fill: string; opacity?: number }) {
  return (
    <Path
      transform={`translate(${x} ${y})`}
      opacity={opacity}
      d={`M0 ${-r} Q0 0 ${r} 0 Q0 0 0 ${r} Q0 0 ${-r} 0 Q0 0 0 ${-r} Z`}
      fill={fill}
    />
  );
}

const PIN = 'M50 96 C44 88 17 64 17 41 C17 22.8 31.8 8 50 8 C68.2 8 83 22.8 83 41 C83 64 56 88 50 96 Z';

// ─── Çizimler ────────────────────────────────────────────────────────────────
function Emergency({ c }: { c: Colors }) {
  // Aynı ekranda birden çok çizim olabilir; kırpma kimliği benzersiz olmalı
  const clip = 'screen' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <>
      <Circle cx={100} cy={84} r={68} fill={c.blob} />
      <Paw x={22} y={140} s={0.8} rot={38} fill={c.honey} opacity={0.35} />
      <Paw x={40} y={132} s={0.8} rot={38} fill={c.honey} opacity={0.55} />
      <Paw x={36} y={112} s={0.8} rot={38} fill={c.honey} opacity={0.75} />
      <Paw x={54} y={104} s={0.8} rot={38} fill={c.honey} />
      {/* telefon */}
      <Rect x={74} y={20} width={60} height={116} rx={13} fill={c.shadow} transform="translate(3 4)" />
      <Rect x={74} y={20} width={60} height={116} rx={13} fill={c.device} />
      <Defs>
        <ClipPath id={clip}>
          <Rect x={79} y={29} width={50} height={98} rx={8} />
        </ClipPath>
      </Defs>
      <Rect x={79} y={29} width={50} height={98} rx={8} fill={c.surface} />
      <G clipPath={`url(#${clip})`}>
        <Path d="M70 72 L140 56" stroke={c.line} strokeWidth={6} />
        <Path d="M96 20 L108 140" stroke={c.line} strokeWidth={5} />
        <Path d="M70 108 L140 98" stroke={c.line} strokeWidth={4} />
        <Circle cx={104} cy={70} r={30} stroke={c.coral} strokeWidth={1.5} fill="none" opacity={0.25} />
        <Circle cx={104} cy={70} r={20} stroke={c.coral} strokeWidth={2} fill="none" opacity={0.4} />
      </G>
      <Rect x={96} y={23.5} width={16} height={3} rx={1.5} fill={c.deviceEdge} />
      <Ellipse cx={104} cy={89} rx={9} ry={3} fill={c.coral} opacity={0.25} />
      <Path d={PIN} transform="translate(86.3 55.4) scale(0.35)" fill={c.coral} />
      <Circle cx={103.8} cy={69.8} r={5.6} fill={c.white} />
      <Rect x={87} y={108} width={34} height={12} rx={6} fill={c.primary} />
      <Rect x={99} y={112} width={10} height={4} rx={2} fill={c.white} />
      {/* kalp baloncuğu */}
      <Circle cx={156} cy={96} r={15} fill={c.shadow} transform="translate(2 3)" />
      <Circle cx={156} cy={96} r={15} fill={c.surface} />
      <Heart x={156} y={97.5} s={1.05} fill={c.coral} />
      <Sparkle x={152} y={40} r={8} fill={c.honey} />
      <Sparkle x={166} y={58} r={4.5} fill={c.honey} opacity={0.7} />
      <Sparkle x={52} y={46} r={5} fill={c.primary} opacity={0.5} />
    </>
  );
}

function PetCard({ c }: { c: Colors }) {
  return (
    <>
      <Circle cx={100} cy={84} r={68} fill={c.blobAlt} />
      <Rect x={38} y={44} width={126} height={84} rx={14} fill={c.shadow} transform="translate(3 5)" />
      <Rect x={38} y={44} width={126} height={84} rx={14} fill={c.surface} />
      <Path d="M38 58 A14 14 0 0 1 52 44 H150 A14 14 0 0 1 164 58 V68 H38 Z" fill={c.primary} />
      <Rect x={50} y={53} width={36} height={5} rx={2.5} fill={c.white} opacity={0.9} />
      <Rect x={130} y={51.5} width={20} height={8} rx={4} fill={c.white} opacity={0.3} />
      <Circle cx={66} cy={95} r={16} fill={c.coralSoft} />
      <Paw x={66} y={95} s={1.05} fill={c.coral} />
      <Rect x={91} y={84} width={52} height={6.5} rx={3.25} fill={c.text} opacity={0.85} />
      <Rect x={91} y={97} width={36} height={5} rx={2.5} fill={c.line} />
      <Rect x={91} y={107} width={58} height={5} rx={2.5} fill={c.line} />
      <Circle cx={160} cy={46} r={14} fill={c.coral} />
      <Heart x={160} y={47.5} s={0.95} fill={c.white} />
      <Sparkle x={30} y={44} r={7} fill={c.honey} />
      <Sparkle x={174} y={118} r={5} fill={c.primary} opacity={0.55} />
      <Sparkle x={42} y={138} r={4} fill={c.honey} opacity={0.7} />
    </>
  );
}

function Community({ c }: { c: Colors }) {
  return (
    <>
      <Circle cx={100} cy={84} r={68} fill={c.blob} />
      {/* soru balonu */}
      <Rect x={28} y={32} width={104} height={58} rx={18} fill={c.shadow} transform="translate(2 4)" />
      <Rect x={28} y={32} width={104} height={58} rx={18} fill={c.surface} />
      <Path d="M50 86 L44 102 L66 88 Z" fill={c.surface} />
      <Circle cx={50} cy={61} r={11} fill={c.honey} />
      <Path d="M46 57.6 C46 53.6 54.4 53.6 54.4 58 C54.4 61 50.2 61.2 50.2 64" stroke={c.white} strokeWidth={2.8} strokeLinecap="round" fill="none" />
      <Circle cx={50.2} cy={68.2} r={1.7} fill={c.white} />
      <Rect x={68} y={52} width={52} height={6.5} rx={3.25} fill={c.text} opacity={0.85} />
      <Rect x={68} y={65} width={36} height={5} rx={2.5} fill={c.line} />
      {/* hekim yanıtı */}
      <Rect x={76} y={86} width={98} height={52} rx={18} fill={c.primary} />
      <Path d="M152 134 L166 148 L140 136 Z" fill={c.primary} />
      <Circle cx={97} cy={112} r={11} fill={c.white} />
      <Path d="M92 112 L95.6 115.6 L102 108.6" stroke={c.primary} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x={115} y={103} width={46} height={6} rx={3} fill={c.white} opacity={0.95} />
      <Rect x={115} y={115} width={32} height={5} rx={2.5} fill={c.white} opacity={0.55} />
      <Paw x={160} y={46} s={1.15} rot={16} fill={c.honey} />
      <Sparkle x={176} y={74} r={5} fill={c.coral} opacity={0.7} />
      <Sparkle x={24} y={114} r={6} fill={c.honey} />
    </>
  );
}

function Vet({ c }: { c: Colors }) {
  return (
    <>
      <Circle cx={100} cy={84} r={68} fill={c.blob} />
      <Path
        transform="translate(-80 -96) scale(3.6)"
        d="M50 61.5 C41 55.2 37.2 50.6 37.2 46.3 C37.2 42.4 40 39.6 43.6 39.6 C46.4 39.6 48.6 41.2 50 43.6 C51.4 41.2 53.6 39.6 56.4 39.6 C60 39.6 62.8 42.4 62.8 46.3 C62.8 50.6 59 55.2 50 61.5 Z"
        fill={c.coralSoft}
      />
      <Path d="M78 34 L78 56 C78 76 100 78 100 78 C100 78 122 76 122 56 L122 34" stroke={c.primaryDeep} strokeWidth={6} strokeLinecap="round" fill="none" />
      <Path d="M100 78 C100 104 128 106 140 116" stroke={c.primaryDeep} strokeWidth={6} strokeLinecap="round" fill="none" />
      <Circle cx={78} cy={31} r={5} fill={c.primaryDeep} />
      <Circle cx={122} cy={31} r={5} fill={c.primaryDeep} />
      <Circle cx={146} cy={121} r={14} fill={c.surface} stroke={c.primaryDeep} strokeWidth={5} />
      <Circle cx={146} cy={121} r={5.5} fill={c.coral} />
      <Circle cx={56} cy={112} r={15} fill={c.primary} />
      <Rect x={49.5} y={109.5} width={13} height={5} rx={1.5} fill={c.white} />
      <Rect x={53.5} y={105.5} width={5} height={13} rx={1.5} fill={c.white} />
      <Sparkle x={156} y={44} r={8} fill={c.honey} />
      <Sparkle x={36} y={62} r={5} fill={c.honey} opacity={0.7} />
    </>
  );
}

function Heat({ c }: { c: Colors }) {
  return (
    <>
      <Circle cx={100} cy={84} r={68} fill={c.honeySoft} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Rect key={i} x={78} y={22} width={6} height={12} rx={3} fill={c.honey} transform={`rotate(${i * 45} 81 68)`} />
      ))}
      <Circle cx={81} cy={68} r={25} fill={c.honey} />
      <Rect x={136} y={46} width={20} height={70} rx={10} fill={c.surface} />
      <Rect x={142} y={64} width={8} height={48} rx={4} fill={c.coral} />
      <Circle cx={146} cy={116} r={14} fill={c.coral} />
      <Rect x={158} y={58} width={8} height={3} rx={1.5} fill={c.line} />
      <Rect x={158} y={70} width={6} height={3} rx={1.5} fill={c.line} />
      <Rect x={158} y={82} width={8} height={3} rx={1.5} fill={c.line} />
      <Path transform="translate(60 118)" d="M0 -14 C5 -7 9 -2 9 3.5 C9 8.5 5 12.5 0 12.5 C-5 12.5 -9 8.5 -9 3.5 C-9 -2 -5 -7 0 -14 Z" fill={c.primary} />
      <Paw x={96} y={128} s={0.9} rot={-10} fill={c.primary} opacity={0.35} />
      <Sparkle x={172} y={36} r={6} fill={c.coral} opacity={0.6} />
    </>
  );
}

function Vaccine({ c }: { c: Colors }) {
  return (
    <>
      <Circle cx={100} cy={84} r={68} fill={c.blob} />
      <Rect x={40} y={40} width={100} height={88} rx={14} fill={c.shadow} transform="translate(3 4)" />
      <Rect x={40} y={40} width={100} height={88} rx={14} fill={c.surface} />
      <Path d="M40 54 A14 14 0 0 1 54 40 H126 A14 14 0 0 1 140 54 V62 H40 Z" fill={c.coral} />
      <Rect x={60} y={32} width={7} height={17} rx={3.5} fill={c.text} />
      <Rect x={113} y={32} width={7} height={17} rx={3.5} fill={c.text} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((k) =>
          r === 1 && k === 2 ? null : <Circle key={`${r}-${k}`} cx={60 + k * 20} cy={78 + r * 17} r={4} fill={c.line} />
        )
      )}
      <Circle cx={100} cy={95} r={9} fill={c.primary} />
      <Path d="M96 95 L99 98 L104.5 92" stroke={c.white} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <G transform="translate(158 104) rotate(-42)">
        <Rect x={-24} y={-8} width={40} height={16} rx={5} fill={c.surface} stroke={c.primaryDeep} strokeWidth={3} />
        <Rect x={-19} y={-3.5} width={22} height={7} rx={2} fill={c.primary} opacity={0.45} />
        <Rect x={16} y={-2.5} width={12} height={5} rx={1} fill={c.primaryDeep} />
        <Rect x={27} y={-9} width={5} height={18} rx={2.5} fill={c.primaryDeep} />
        <Path d="M-24 0 L-38 0" stroke={c.primaryDeep} strokeWidth={2.5} strokeLinecap="round" />
      </G>
      <Sparkle x={34} y={44} r={6} fill={c.honey} />
      <Sparkle x={168} y={52} r={5} fill={c.honey} opacity={0.7} />
    </>
  );
}

function Shield({ c }: { c: Colors }) {
  return (
    <>
      <Circle cx={100} cy={84} r={68} fill={c.blob} />
      <Path d="M100 26 L144 42 V80 C144 108 124 128 100 138 C76 128 56 108 56 80 V42 Z" fill={c.shadow} transform="translate(3 4)" />
      <Path d="M100 26 L144 42 V80 C144 108 124 128 100 138 C76 128 56 108 56 80 V42 Z" fill={c.primary} />
      <Path d="M100 38 L132 50 V80 C132 101 118 117 100 125 Z" fill={c.white} opacity={0.12} />
      <Paw x={100} y={80} s={2.2} fill={c.white} />
      <Circle cx={146} cy={118} r={14} fill={c.coral} />
      <Heart x={146} y={119.5} s={0.95} fill={c.white} />
      <Sparkle x={48} y={46} r={7} fill={c.honey} />
      <Sparkle x={160} y={42} r={5} fill={c.honey} opacity={0.7} />
    </>
  );
}

function Chat({ c }: { c: Colors }) {
  return (
    <>
      <Circle cx={100} cy={84} r={68} fill={c.blob} />
      <Rect x={30} y={36} width={92} height={46} rx={18} fill={c.shadow} transform="translate(2 4)" />
      <Rect x={30} y={36} width={92} height={46} rx={18} fill={c.surface} />
      <Path d="M48 78 L42 92 L62 80 Z" fill={c.surface} />
      <Rect x={46} y={52} width={58} height={6} rx={3} fill={c.text} opacity={0.85} />
      <Rect x={46} y={64} width={40} height={5} rx={2.5} fill={c.line} />
      <Rect x={84} y={92} width={86} height={42} rx={18} fill={c.primary} />
      <Path d="M150 130 L164 144 L138 132 Z" fill={c.primary} />
      <Circle cx={112} cy={113} r={4.5} fill={c.white} />
      <Circle cx={127} cy={113} r={4.5} fill={c.white} opacity={0.75} />
      <Circle cx={142} cy={113} r={4.5} fill={c.white} opacity={0.5} />
      <Circle cx={156} cy={48} r={14} fill={c.coral} />
      <Heart x={156} y={49.5} s={0.95} fill={c.white} />
      <Sparkle x={34} y={116} r={6} fill={c.honey} />
    </>
  );
}

const ART: Record<ArtName, (p: { c: Colors }) => React.ReactElement> = {
  emergency: Emergency,
  petcard: PetCard,
  community: Community,
  vet: Vet,
  heat: Heat,
  vaccine: Vaccine,
  shield: Shield,
  chat: Chat,
};

export function Art({
  name,
  width = 200,
  onColor = false,
  dark,
}: {
  name: ArtName;
  width?: number;
  onColor?: boolean;
  dark?: boolean; // koyu zemin (ör. gece bannerı) için koyu tema renklerini zorla
}) {
  const t = useTheme();
  const c = colors(dark ? { ...t, dark: true } : t, onColor);
  const Body = ART[name] ?? Shield;
  return (
    <Svg width={width} height={width * 0.8} viewBox="0 0 200 160">
      <Body c={c} />
    </Svg>
  );
}
