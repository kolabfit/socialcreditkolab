export type Role = 'intern' | 'academic' | 'field';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  score: number;
  attendanceCount: number;
  presentCount?: number;
  permissionCount?: number;
  alpaCount?: number;
  sickCount?: number;
  totalDays: number;
  password?: string;
  nickname?: string;
  phone?: string;
  nim?: string;
  startup?: string;
  lecturerCode?: string;
  advisedStartups?: string[];
  status?: 'active' | 'suspended';
  photoUrl?: string;
  rubricScores?: Record<string, number>;
}

export interface ActivityLog {
  id: string;
  internId: string;
  date: string;
  activity: string;
  obstacle: string;
}

export interface BehaviorReport {
  id: string;
  targetId: string; // can be internId or startup name
  targetType?: 'intern' | 'startup';
  reporterId: string;
  date: string;
  type: 'good' | 'bad';
  description: string;
  photoUrl?: string;
  pointsImpact: number;
  aspectId?: string;
}

export interface RubricAspect {
  id: string;
  name: string;
  weight: number; // percentage
}

export interface Startup {
  id: string;
  name: string;
  description: string;
}

export interface Batch {
  id: string;
  name: string;
  date_range: string;
  status: 'active' | 'completed';
}

export interface LeaveRequest {
  id: string;
  internId: string;
  date: string;
  endDate?: string;
  type: 'Izin' | 'Sakit' | 'WFH';
  reason: string;
  attachmentUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'pending_academic' | 'pending_hr';
  approvalAcademic?: boolean | null;
  approvalHr?: boolean | null;
}

export interface AttendanceRecord {
  id: string;
  internId: string;
  date: string;
  type: 'Kantor' | 'WFH' | 'Izin' | 'Sakit' | 'Alpa';
  photoProof?: string;
  checkInTime?: string;
  checkOutTime?: string;
  location?: string;
}

export interface IncidentReport {
  id: string;
  internId: string;
  date: string;
  title: string;
  description: string;
  attachmentUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
}
