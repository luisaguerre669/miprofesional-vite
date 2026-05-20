import {
  Building2, Wrench, Hammer, Zap, Droplets, Paintbrush, Lock, TreePine,
  SprayCan, Truck, Stethoscope, Users, Heart, Briefcase, AlertTriangle,
  ChevronLeft, ChevronRight, Shield, Clock, UserPlus, LayoutGrid, X, Phone,
  CheckCircle, Award, TrendingUp, MessageCircle, LogOut, Menu, User, Settings,
  Search, ArrowRight, Star, MapPin, Monitor, Car, Home, Wifi, Camera, Code,
  Snowflake, Flame, CircleDot, Dog, Sparkles, ChefHat, Scissors, Leaf,
  Scale, Palette, GraduationCap, Bus, Calendar, BookOpen, Music4, Megaphone,
  BadgeCheck, ChevronDown, ChevronUp, Eye, EyeOff, Mail, LockKeyhole, Globe,
  ShoppingBag, Tag, Percent, CreditCard, Landmark, FileText, SlidersHorizontal,
  Filter, XCircle, Check, MenuSquare, List, Grid, RefreshCw, Loader2
} from 'lucide-react';

export const iconMap = {
  Building2, Wrench, Hammer, Zap, Droplets, Paintbrush, Lock, TreePine,
  SprayCan, Truck, Stethoscope, Users, Heart, Briefcase, AlertTriangle,
  Shield, Monitor, Car, Home, Wifi, Camera, Code, Snowflake, Flame,
  CircleDot, Dog, Sparkles, ChefHat, Scissors, Leaf,
  Scale, Palette, GraduationCap, Bus, Calendar, BookOpen, Music4, Megaphone,
  BadgeCheck, Mail, LockKeyhole, Globe, ShoppingBag, Tag, Percent, CreditCard,
  Landmark, FileText, SlidersHorizontal, Filter, XCircle, Check,
  MenuSquare, List, Grid, RefreshCw, Loader2,
};

export function resolveIcon(name, fallback = Briefcase) {
  return iconMap[name] || fallback;
}

export function getInlineGradient(hex, intensity = 0.85) {
  if (!hex) return 'linear-gradient(135deg, #4b5563, #374151)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const alpha = Math.round(intensity * 255).toString(16).padStart(2, '0');
  return `linear-gradient(135deg, ${hex}${alpha}, ${hex}66)`;
}
