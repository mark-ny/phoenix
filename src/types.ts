export type ViewKey = 'dashboard' | 'devices' | 'eraser' | 'recovery' | 'os-manager' | 'firmware' | 'diagnostics' | 'customers' | 'jobs' | 'certificates' | 'subscription' | 'settings';

export type NavItem = {
  key: ViewKey;
  label: string;
  icon: string;
  group: 'work' | 'records' | 'system';
};
