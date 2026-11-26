import { Home, Wind, Bot, ListTodo, House, Leaf, Users, Settings, LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
  searchKeywords: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', path: '/', label: 'Overview', icon: Home, searchKeywords: 'home dashboard summary overview' },
  { id: 'monitor', path: '/monitor', label: 'Air Quality Monitor', icon: Wind, searchKeywords: 'air aqi pm pm25 pm10 station pollutant map monitor' },
  { id: 'assistant', path: '/assistant', label: 'AI Air Assistant', icon: Bot, searchKeywords: 'ai chat ask assistant advisor recommendations gemini' },
  { id: 'planner', path: '/planner', label: 'Daily Action Planner', icon: ListTodo, searchKeywords: 'plan daily task checklist actions routine habit' },
  { id: 'indoor', path: '/indoor', label: 'Indoor Air Care', icon: House, searchKeywords: 'indoor purifier cook dust room ventilation kitchen bedroom' },
  { id: 'greener', path: '/greener', label: 'Explore Greener Choices', icon: Leaf, searchKeywords: 'green metro cycle walk carpool emissions carbon sustainable' },
  { id: 'community', path: '/community', label: 'Community Impact', icon: Users, searchKeywords: 'community challenge impact participants collective emissions' },
  { id: 'settings', path: '/settings', label: 'Settings', icon: Settings, searchKeywords: 'setting profile privacy notification theme sensitivity' },
];
