export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export interface DeviceInfo {
  name: string;
  os: string;
  browser: string;
  type: DeviceType;
}

export type ConnectionState =
  | 'idle'
  | 'creating'
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface SessionData {
  sessionId: string;
  token: string;
  expiresAt: number;
  role: 'host' | 'joiner';
  peerDeviceInfo?: DeviceInfo;
}

export type TransferState =
  | 'pending'
  | 'offered'
  | 'preparing'
  | 'transferring'
  | 'verifying'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface FileTransferItem {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  progress: number; // 0 to 100
  transferredBytes: number;
  speed: number; // bytes/sec
  eta: number; // seconds
  state: TransferState;
  error?: string;
  blobUrl?: string;
  sha256?: string;
  isIncoming: boolean;
  startTime?: number;
  endTime?: number;
  chunksReceived?: number;
  totalChunks?: number;
}

export interface TextTransferItem {
  id: string;
  text: string;
  isUrl: boolean;
  timestamp: number;
  isIncoming: boolean;
}

export interface SignalingOfferMessage {
  type: 'signal_offer';
  sdp: RTCSessionDescriptionInit;
}

export interface SignalingAnswerMessage {
  type: 'signal_answer';
  sdp: RTCSessionDescriptionInit;
}

export interface SignalingIceCandidateMessage {
  type: 'ice_candidate';
  candidate: RTCIceCandidateInit;
}

export type AppTab = 'transfer' | 'history' | 'profile' | 'privacy' | 'help';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  deviceName?: string;
  createdAt?: string;
  updatedAt?: string;
  emailConfirmed?: boolean;
  provider?: 'email' | 'google';
}

export interface SignUpOptions {
  email: string;
  password: string;
  fullName: string;
  avatarFile?: File | Blob | null;
  deviceName?: string;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'ضعيفة جداً' | 'ضعيفة' | 'متوسطة' | 'جيدة' | 'قوية';
  color: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}
