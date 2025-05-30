import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'statistics', title: 'Statistics', href: paths.dashboard.statistics, icon: 'chart-pie' },
  { key: 'notes', title: 'Notes', href: paths.dashboard.notes.index, icon: 'notes' },
  { key: 'timer', title: 'Timer', href: paths.dashboard.timer, icon: 'timer' },
  { key: 'reminders', title: 'Reminders', href: paths.dashboard.reminders, icon: 'bell' },
  { key: 'account', title: 'Account', href: paths.dashboard.account, icon: 'user' },
] satisfies NavItemConfig[];
