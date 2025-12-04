

export enum UserTier {
  BASIC = 'Basic',
  PROFESSIONAL = 'Professional',
  EXPERT = 'Expert'
}

export interface User {
  id: string;
  name: string;
  email: string;
  tier: UserTier;
  signupDate: string;
  mandateActive: boolean;
  earnings: number;
  qualityScore: number;
  completedTasks: number;
  referralLink?: string;
}

export type TaskPlatform = 'YouTube' | 'TikTok' | 'Instagram';
export type TaskCategory = 'Day' | 'Night';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed' | 'Locked';

export interface Task {
  id: string;
  platform: TaskPlatform;
  category: TaskCategory;
  title: string;
  url: string;
  payout: number;
  status: TaskStatus;
  startTime?: number; // Timestamp when task started
  durationMinutes: number; // Duration required to complete
  newTabWindow?: Window | null; // Reference to the opened window for monitoring
}

export interface ChartData {
  name: string;
  value: number;
  amt?: number;
}

// Admin Message Types
export enum AdminMessageType {
  PROMOTIONAL = 'promotional',
  GENERAL = 'general',
  ALERT = 'alert'
}

// Admin Message Interface
export interface AdminMessage {
  id: string;
  type: AdminMessageType;
  title: string;
  content: string;
  timestamp: string; // ISO string
  read: boolean;
}

// File Item Interface
export interface FileItem {
  id: string;
  name: string;
  icon: string; // Lucide icon name or URL
  color: string; // Tailwind color class for icon background
  uploadedBy: 'user' | 'admin';
  uploadDate: string; // ISO string
}


// Props for Dashboard components received via Outlet context
export interface DashboardOutletContext {
  user: User;
  addEarnings: (amount: number) => void;
  isEarningsAnimating: boolean;
  tasks: Task[]; // Lifted tasks state
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>; // Lifted setTasks
  startTask: (taskId: string, url: string) => void; // Lifted startTask
  completeTask: (taskId: string) => void; // Lifted completeTask
  failTask: (taskId: string) => void; // Lifted failTask
  tasksInProgressCount: number;
  tasksPendingAvailabilityCount: number;
  totalTasksTodayCount: number;
  activeSessionDuration: number; // For auto-time tracker
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>; // For reminder card
}

// Props for UserProvider (if used) or directly for components
export interface UserProps {
  user: User;
  addEarnings: (amount: number) => void;
  isAnimating?: boolean;
  onAnimationComplete?: () => void;
}

export interface TaskCardProps {
  task: Task;
  onStart: (taskId: string, url: string) => void;
  onComplete: (taskId: string) => void;
  onFail: (taskId: string) => void; // Added onFail prop
}

export interface TopbarProps {
  user: User;
  onChatToggle?: () => void;
  unreadNotificationsCount: number; // New prop
  onShowNotifications: () => void; // New prop
}

export interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  messages: AdminMessage[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export interface AdminProps {
  onSendAdminMessage: (message: Omit<AdminMessage, 'id' | 'timestamp' | 'read'>) => void;
}

// Admin-published task interface
export interface AdminTask {
  id: string;
  platform: TaskPlatform;
  category: TaskCategory;
  title: string;
  url: string;
  payout: number;
  targetUsers: 'all' | string[]; // 'all' or array of user IDs
  publishedAt: string; // ISO string
  publishedBy: string; // admin email
}

// Props for Admin component with task publishing
export interface AdminTaskPublishProps {
  onPublishTask: (task: Omit<AdminTask, 'id' | 'publishedAt'>) => void;
}