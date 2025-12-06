

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
  referralCode?: string;
}

export type TaskPlatform = 'YouTube' | 'TikTok' | 'Instagram';
export type TaskCategory = 'Day' | 'Night';
export type TaskStatus = 'Pending' | 'In Progress' | 'Awaiting Submission' | 'Verifying' | 'Completed' | 'Failed' | 'Locked';

export interface Task {
  id: string;
  platform: TaskPlatform;
  category: TaskCategory;
  title: string;
  url: string;
  payout: number;
  status: TaskStatus;
  startTime?: number;
  durationMinutes: number;
  newTabWindow?: Window | null;
  timeSpentSeconds?: number;
  verificationMessage?: string;
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
  tasks: Task[];
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  startTask: (taskId: string, url: string) => void;
  submitTask: (taskId: string) => Promise<{ success: boolean; message: string; earnings?: number }>;
  completeTask: (taskId: string) => void;
  failTask: (taskId: string) => void;
  tasksInProgressCount: number;
  tasksPendingAvailabilityCount: number;
  totalTasksTodayCount: number;
  activeSessionDuration: number;
  setIsChatOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
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