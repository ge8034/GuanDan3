import React from 'react'

interface IconProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export const MountainIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L2 22h20L12 2z" />
    <path d="M12 2l5 10h-10l5-10z" />
    <path d="M12 8l3 6h-6l3-6z" />
  </svg>
)

export const WaterIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    <path d="M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    <path d="M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
  </svg>
)

export const CloudIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
)

export const SunIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
)

export const MoonIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

export const TreeIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L2 22h20L12 2z" />
    <path d="M12 8v14" />
    <path d="M8 14h8" />
  </svg>
)

export const BoatIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 21c1-1 2-1 3 0s2 1 3 0 2-1 3 0 2 1 3 0 2-1 3 0" />
    <path d="M3 21v-2c0-1 1-2 2-2h14c1 0 2 1 2 2v2" />
    <path d="M12 3v14" />
    <path d="M12 3l4 4h-8l4-4z" />
  </svg>
)

export const BridgeIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 20h20" />
    <path d="M4 20v-8c0-4 4-8 8-8s8 4 8 8v8" />
    <path d="M12 12v8" />
  </svg>
)

export const PavilionIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L2 12h20L12 2z" />
    <path d="M4 12v10h16V12" />
    <path d="M8 12v10" />
    <path d="M16 12v10" />
    <path d="M12 12v10" />
  </svg>
)

export const InkIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2c-4 0-8 4-8 8s4 8 8 8 8-4 8-8-4-8-8-8z" />
    <path d="M12 6c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4z" />
    <path d="M12 10v12" />
  </svg>
)

export const ScrollIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 3v18" />
    <path d="M16 3v18" />
    <path d="M3 8h18" />
    <path d="M3 16h18" />
    <path d="M8 8h8v8H8z" />
  </svg>
)

export const HomeIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6v10" />
  </svg>
)

export const GameIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const TrophyIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9H4.5A2.5 2.5 0 0 1 2 6.5V6a2.5 2.5 0 0 1 2.5-2.5H6" />
    <path d="M18 9h1.5A2.5 2.5 0 0 0 22 6.5V6a2.5 2.5 0 0 0-2.5-2.5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)

export const UserIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

export const SettingsIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

export const LogoutIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export const HistoryIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

export const PlusIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export const SearchIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

export const FilterIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

export const SortIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
)

export const CloseIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export const CheckIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

export const InfoIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

export const WarningIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

export const ErrorIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

export const BuildingIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4 8 4v14" />
    <path d="M8 21v-4h8v4" />
    <path d="M8 10h2" />
    <path d="M14 10h2" />
    <path d="M8 14h2" />
    <path d="M14 14h2" />
  </svg>
)

export const RefreshIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

export const UserGroupIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export const OnlineIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

export const DocumentIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

export const LightningIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

export const BookIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 3h6v18H2z" />
    <path d="M8 3h6v18H8z" />
    <path d="M14 3h6v18h-6z" />
    <path d="M2 8h18" />
    <path d="M2 13h18" />
  </svg>
)

export const ShieldIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

export const StarIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

export const ZapIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

export const PauseIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
)

export const PlayIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg
    className={`${sizeStyles[size]} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="5 3 19 12 5 12 19 21 12" />
  </svg>
)
