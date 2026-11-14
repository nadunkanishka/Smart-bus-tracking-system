import React from 'react';
import {
  Activity, Bus, Calendar, ChartColumn, Check, CreditCard, Eye, Gauge, Hash, LayoutGrid, Lock, LogOut, MapPin, Menu,
  Pencil, Phone, Plus, RefreshCw, Route, Ruler, Settings, Trash2, User, Users, X,
} from 'lucide-react';

// One outline icon set (Lucide), thin rounded strokes, by short name.
const ICONS = {
  tiles: LayoutGrid, drivers: Users, bus: Bus, route: Route, pulse: Activity, chart: ChartColumn,
  sync: RefreshCw, plus: Plus, trash: Trash2, menu: Menu, edit: Pencil, close: X, check: Check, user: User, lock: Lock,
  eye: Eye, card: CreditCard, calendar: Calendar, phone: Phone, gauge: Gauge, pin: MapPin, hash: Hash, ruler: Ruler,
  logout: LogOut, settings: Settings,
};

// An unknown name is a typo: it fails loudly while developing and draws nothing in a deployed build.
export default function Icon({ type, className }) {
  const Glyph = ICONS[type];
  if (!Glyph) {
    if (process.env.NODE_ENV !== 'production') throw new Error(`Icon: unknown type "${type}"`);
    return null;
  }
  return <Glyph className={className} strokeWidth={1.75} aria-hidden="true" />;
}
