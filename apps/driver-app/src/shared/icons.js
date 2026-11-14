// SmartBus icons for the mobile apps: Lucide (thin rounded outlines), wrapped so every call site keeps its
// { color, size } props. Source of truth lives in /shared/native and is copied by `node shared/sync.js`.
import React from 'react';
import { View } from 'react-native';
import {
  ArrowLeft, ArrowRight, Bell, Bus, Check, ChevronDown, Clock, EllipsisVertical, Flag, Gauge, Lock, MapPin,
  MessageCircle, Navigation, Phone, Play, Route, Search, Settings, Square, User,
} from 'lucide-react-native';
import { COLORS } from './theme';

const STROKE = 1.75;
const make = (Glyph, fallbackColor, fallbackSize, extra) => function SmartBusIcon({ color, size = fallbackSize, ...rest }) {
  return <Glyph color={color || fallbackColor()} size={size} strokeWidth={STROKE} {...extra} {...rest} />;
};

export const BusIcon = make(Bus, () => COLORS.accentText, 20);
export const LockIcon = make(Lock, () => COLORS.ink, 20);
export const MapPinIcon = make(MapPin, () => COLORS.accentText, 18);
export const FlagIcon = make(Flag, () => COLORS.accentText, 18);
export const SettingsIcon = make(Settings, () => COLORS.muted, 20);
export const UserIcon = make(User, () => COLORS.muted, 20);
export const ChevronDownIcon = make(ChevronDown, () => COLORS.muted, 16);
export const ArrowRightIcon = make(ArrowRight, () => COLORS.accentText, 16);
export const ArrowLeftIcon = make(ArrowLeft, () => COLORS.ink, 20);
export const CheckIcon = make(Check, () => COLORS.white, 10, { strokeWidth: 3.2 });
export const SearchIcon = make(Search, () => COLORS.muted, 18);
export const PhoneCallIcon = make(Phone, () => COLORS.white, 18);
export const MessageCircleIcon = make(MessageCircle, () => COLORS.ink, 18);
export const MoreVerticalIcon = make(EllipsisVertical, () => COLORS.ink, 20);
export const NavigationArrowIcon = make(Navigation, () => COLORS.white, 16);
export const SpeedometerIcon = make(Gauge, () => COLORS.muted, 18);
export const ClockIcon = make(Clock, () => COLORS.muted, 16);
export const RouteIcon = make(Route, () => COLORS.muted, 20);

// Play and stop read as solid glyphs (the duty button).
export function PlayIcon({ color = COLORS.white, size = 16 }) {
  return <Play color={color} fill={color} size={size} strokeWidth={STROKE} />;
}
export function StopIcon({ color = COLORS.white, size = 16 }) {
  return <Square color={color} fill={color} size={size} strokeWidth={STROKE} />;
}

// Bell with an optional green dot (something is live).
export function BellIcon({ color = COLORS.ink, size = 20, hasBadge = true }) {
  return (
    <View style={{ width: size, height: size }}>
      <Bell color={color} size={size} strokeWidth={STROKE} />
      {hasBadge ? <View style={{ position: 'absolute', top: -1, right: -1, width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.green, borderWidth: 1.5, borderColor: COLORS.surface }} /> : null}
    </View>
  );
}
