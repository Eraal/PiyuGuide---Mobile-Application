import { BACKEND_URL } from "../constants/backend";
import type { ChatMessage } from "../types/chat";

export type MobileCampus = {
  id: number;
  name: string;
  shortName: string;
  code: string;
  address: string | null;
  description: string | null;
  themeKey: "blue" | "emerald" | "violet" | "sunset" | "teal";
};

export type MobileDepartment = {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
};

export type MobileOffice = {
  id: number;
  name: string;
  description: string | null;
  building: string | null;
  floor: string | null;
};

export type MobileInquiryNature = {
  id: number;
  name: string;
  description: string | null;
  allowsOther: boolean;
};

export type MobileUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  isOnline: boolean;
  emailVerified: boolean;
  campusId: number | null;
  campusName: string | null;
  profilePicUrl: string | null;
  contactNumber?: string | null;
  student: {
    id: number;
    studentNumber: string | null;
    department: string | null;
    departmentId: number | null;
    yearLevel: string | null;
    section: string | null;
    campusId: number | null;
  } | null;
};

export type MobileNotification = {
  id: number;
  title: string;
  message: string;
  type: string;
  inquiryId?: number;
  officeId?: number;
  isRead: boolean;
  createdAt: string;
  link?: string;
};

export type MobileInquirySummary = {
  id: number;
  subject: string;
  status: string;
  officeId: number | null;
  officeName: string | null;
  campusId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  latestMessagePreview: string | null;
  latestMessageAt: string | null;
};

export type MobileInquiryDetails = {
  id: number;
  subject: string;
  status: string;
  createdAt: string | null;
  office: {
    id: number;
    name: string;
    description: string | null;
  } | null;
  concerns: string[];
};

export type MobileCounselingSession = {
  id: number;
  status: string;
  scheduledAt: string | null;
  durationMinutes: number;
  isVideoSession: boolean;
  notes: string | null;
  meetingId: string | null;
  meetingPassword: string | null;
  meetingUrl: string | null;
  office: {
    id: number;
    name: string;
  } | null;
  counselor: {
    id: number;
    fullName: string;
    role: string;
  } | null;
  natureOfConcern: string | null;
  feedback: {
    message: string;
    createdAt: string;
  } | null;
};

type LoginResponse = {
  success: boolean;
  message?: string;
  needs_verification?: boolean;
  user?: {
    id: number;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
    is_online: boolean;
    email_verified: boolean;
    campus_id: number | null;
    campus_name: string | null;
    profile_pic_url: string | null;
    contact_number?: string | null;
    student: {
      id: number;
      student_number: string | null;
      department: string | null;
      department_id: number | null;
      year_level: string | null;
      section: string | null;
      campus_id: number | null;
    } | null;
  };
};

type CampusListResponse = {
  success: boolean;
  campuses: Array<{
    id: number;
    name: string;
    short_name: string;
    code: string;
    address: string | null;
    description: string | null;
    theme_key: MobileCampus["themeKey"] | null;
  }>;
};

type DepartmentListResponse = {
  success: boolean;
  departments: Array<{
    id: number;
    name: string;
    code: string | null;
    description: string | null;
  }>;
};

type SelectCampusResponse = {
  success: boolean;
  message?: string;
  campus: CampusListResponse["campuses"][number];
};

type RegisterResponse = {
  success: boolean;
  message?: string;
  needs_verification?: boolean;
  selected_campus_id?: number | null;
  user?: LoginResponse["user"];
};

type InquiryListResponse = {
  success: boolean;
  inquiries: Array<{
    id: number;
    subject: string;
    status: string;
    office_id: number | null;
    office_name: string | null;
    campus_id: number | null;
    created_at: string | null;
    updated_at: string | null;
    latest_message_preview: string | null;
    latest_message_at: string | null;
  }>;
};

type MessageListResponse = {
  success: boolean;
  messages: Array<{
    id: number;
    content: string;
    timestamp: string | null;
    sender_name: string;
    sender_role: string | null;
    sender_avatar_url: string | null;
    is_current_user: boolean;
    status: string;
    attachments: Array<{
      filename: string;
      file_path: string;
      file_type: string | null;
      file_size: number | null;
    }>;
    client_msg_id?: string | null;
  }>;
  has_more: boolean;
};

type SendMessageResponse = {
  success: boolean;
  message_id: number;
  client_msg_id?: string | null;
  message: MessageListResponse['messages'][number];
};

type CurrentUserResponse = {
  success: boolean;
  user: LoginResponse["user"];
};

type OfficeListResponse = {
  success: boolean;
  offices: Array<{
    id: number;
    name: string;
    description: string | null;
    building: string | null;
    floor: string | null;
  }>;
};

type InquiryNatureListResponse = {
  success: boolean;
  natures: Array<{
    id: number;
    name: string;
    description: string | null;
    allows_other: boolean;
  }>;
};

type SubmitInquiryResponse = {
  success: boolean;
  inquiry_id: number;
  message: string;
};

function buildBackendUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}${normalizedPath}`;
}

function deriveCampusShortName(name: string) {
  const prefix = "Laguna State Polytechnic University - ";
  if (name.startsWith(prefix)) {
    return name.slice(prefix.length).trim() || name;
  }

  const separatorIndex = name.indexOf(" - ");
  if (separatorIndex >= 0) {
    return name.slice(separatorIndex + 3).trim() || name;
  }

  return name;
}

async function requestJson<T>(path: string, init: RequestInit & { json?: unknown } = {}) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  let body = init.body;
  if (Object.prototype.hasOwnProperty.call(init, "json")) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }

  let response: Response;
  try {
    response = await fetch(buildBackendUrl(path), {
      ...init,
      body,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error("Unable to reach the PiyuGuide backend.");
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Request failed with status ${response.status}.`);
  }

  return payload as T;
}

function mapMobileUser(raw: NonNullable<LoginResponse['user']>): MobileUser {
  return {
    id: raw.id,
    fullName: raw.full_name,
    email: raw.email,
    role: raw.role,
    isActive: raw.is_active,
    isOnline: raw.is_online,
    emailVerified: raw.email_verified,
    campusId: raw.campus_id,
    campusName: raw.campus_name,
    profilePicUrl: raw.profile_pic_url,
    contactNumber: raw.contact_number ?? null,
    student: raw.student
      ? {
          id: raw.student.id,
          studentNumber: raw.student.student_number,
          department: raw.student.department,
          departmentId: raw.student.department_id,
          yearLevel: raw.student.year_level,
          section: raw.student.section,
          campusId: raw.student.campus_id,
        }
      : null,
  };
}

function mapMobileCampus(raw: CampusListResponse["campuses"][number]): MobileCampus {
  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.short_name || deriveCampusShortName(raw.name),
    code: raw.code,
    address: raw.address,
    description: raw.description,
    themeKey: raw.theme_key || "blue",
  };
}

function mapMobileDepartment(raw: DepartmentListResponse["departments"][number]): MobileDepartment {
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    description: raw.description,
  };
}

function mapInquirySummary(raw: InquiryListResponse['inquiries'][number]): MobileInquirySummary {
  return {
    id: raw.id,
    subject: raw.subject,
    status: raw.status,
    officeId: raw.office_id,
    officeName: raw.office_name,
    campusId: raw.campus_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    latestMessagePreview: raw.latest_message_preview,
    latestMessageAt: raw.latest_message_at,
  };
}

function mapCounselingSession(raw: any): MobileCounselingSession {
  return {
    id: raw.id,
    status: raw.status,
    scheduledAt: raw.scheduled_at,
    durationMinutes: raw.duration_minutes,
    isVideoSession: raw.is_video_session,
    notes: raw.notes,
    meetingId: raw.meeting_id,
    meetingPassword: raw.meeting_password,
    meetingUrl: raw.meeting_url,
    office: raw.office ? { id: raw.office.id, name: raw.office.name } : null,
    counselor: raw.counselor ? { id: raw.counselor.id, fullName: raw.counselor.full_name, role: raw.counselor.role } : null,
    natureOfConcern: raw.nature_of_concern,
    feedback: raw.feedback ? {
      message: raw.feedback.message,
      createdAt: raw.feedback.created_at,
    } : null,
  };
}

function mapChatMessage(raw: MessageListResponse['messages'][number]): ChatMessage {
  return {
    id: String(raw.id),
    text: raw.content,
    sender: raw.is_current_user ? "me" : "them",
    senderName: raw.sender_name,
    senderAvatarUrl: raw.sender_avatar_url ?? null,
    timestamp: raw.timestamp ?? undefined,
    status: raw.status ?? undefined,
    attachments: raw.attachments?.map((a) => ({
      filename: a.filename,
      filePath: a.file_path,
      fileType: a.file_type,
      fileSize: a.file_size,
    })),
  };
}

export async function loginToBackend(credentials: { email: string; password: string }) {
  const response = await requestJson<LoginResponse>("/api/mobile/login", {
    method: "POST",
    json: credentials,
  });

  if (!response.user) {
    throw new Error(response.message || "Login failed.");
  }

  return {
    user: mapMobileUser(response.user),
    needsVerification: response.needs_verification === true,
    message: response.message ?? "Login successful.",
  };
}

export async function selectCampusOnBackend(campusId: number) {
  const response = await requestJson<SelectCampusResponse>("/api/mobile/select-campus", {
    method: "POST",
    json: { campus_id: campusId },
  });

  return {
    message: response.message ?? "Campus selected.",
    campus: mapMobileCampus(response.campus),
  };
}

export async function loadCampuses() {
  const response = await requestJson<CampusListResponse>("/api/mobile/campuses", {
    method: "GET",
  });

  return response.campuses.map(mapMobileCampus);
}

export async function loadCampusDepartments(campusId: number) {
  const response = await requestJson<DepartmentListResponse>(
    `/api/mobile/campuses/${campusId}/departments`,
    {
      method: "GET",
    },
  );

  return response.departments.map(mapMobileDepartment);
}

export async function registerStudent(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  campusId: number;
  studentNumber: string;
  departmentId: number;
  yearLevel: string;
  section: string;
}) {
  const response = await requestJson<RegisterResponse>("/api/mobile/register", {
    method: "POST",
    json: {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      password: payload.password,
      confirm_password: payload.password, // Already validated in UI
      campus_id: payload.campusId,
      student_number: payload.studentNumber,
      department_id: payload.departmentId,
      year_level: payload.yearLevel,
      section: payload.section,
    },
  });

  return {
    message: response.message ?? "Registration successful.",
    needsVerification: response.needs_verification === true,
    selectedCampusId: response.selected_campus_id ?? null,
    user: response.user ? mapMobileUser(response.user) : null,
  };
}

export async function loadStudentInquiries() {
  const response = await requestJson<InquiryListResponse>("/api/mobile/inquiries", {
    method: "GET",
  });

  return response.inquiries.map(mapInquirySummary);
}

export async function loadInquiryMessages(inquiryId: number, limit = 50) {
  const response = await requestJson<MessageListResponse>(
    `/api/mobile/inquiry/${inquiryId}/messages?limit=${encodeURIComponent(String(limit))}`,
    {
      method: "GET",
    },
  );

  return {
    messages: response.messages.map(mapChatMessage),
    hasMore: response.has_more,
  };
}

export async function loadInquiryDetails(inquiryId: number) {
  const response = await requestJson<{ success: boolean; inquiry: any }>(
    `/api/mobile/inquiry/${inquiryId}`,
    {
      method: "GET",
    },
  );

  return response.inquiry as MobileInquiryDetails;
}

export async function sendInquiryMessage(
  inquiryId: number,
  message: string,
  file?: { uri: string; name: string; mimeType?: string | null; size?: number | null },
) {
  if (file) {
    // Use FormData for multipart upload (file + message)
    const formData = new FormData();
    formData.append("message", message);
    formData.append("client_msg_id", `mobile_${Date.now()}`);
    formData.append("attachments", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? "application/octet-stream",
    } as unknown as Blob);

    const url = `${BACKEND_URL}/api/mobile/inquiry/${inquiryId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.message ?? `Upload failed (${res.status})`);
    }

    const data = (await res.json()) as SendMessageResponse;
    return mapChatMessage(data.message);
  }

  // Text-only: use standard JSON request
  const response = await requestJson<SendMessageResponse>(`/api/mobile/inquiry/${inquiryId}/messages`, {
    method: "POST",
    json: { message },
  });

  return mapChatMessage(response.message);
}

export async function getCurrentUser() {
  try {
    const response = await requestJson<CurrentUserResponse>("/api/mobile/me", {
      method: "GET",
    });
    return response.user ? mapMobileUser(response.user) : null;
  } catch {
    return null;
  }
}

export async function loadNotifications() {
  const response = await requestJson<{ success: boolean; notifications: any[] }>("/api/mobile/notifications", {
    method: "GET",
  });

  return response.notifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.notification_type,
    inquiryId: n.inquiry_id,
    officeId: n.source_office_id,
    isRead: n.is_read,
    createdAt: n.created_at,
    link: n.link,
  })) as MobileNotification[];
}

export async function markNotificationRead(notificationId?: number) {
  await requestJson("/api/mobile/notifications/mark-read", {
    method: "POST",
    json: { notification_id: notificationId },
  });
}

export async function loadOffices() {
  const response = await requestJson<OfficeListResponse>("/api/mobile/offices", {
    method: "GET",
  });

  return response.offices.map((raw) => ({
    id: raw.id,
    name: raw.name,
    description: raw.description,
    building: raw.building,
    floor: raw.floor,
  }));
}

export async function loadInquiryNatures(officeId: number) {
  const response = await requestJson<InquiryNatureListResponse>(`/api/mobile/offices/${officeId}/inquiry-natures`, {
    method: "GET",
  });

  return response.natures.map((raw) => ({
    id: raw.id,
    name: raw.name,
    description: raw.description,
    allowsOther: raw.allows_other,
  }));
}

export async function submitNewInquiry(payload: {
  officeId: number;
  subject: string;
  message: string;
  concernTypeId?: number;
  otherConcern?: string;
}) {
  const response = await requestJson<SubmitInquiryResponse>("/api/mobile/inquiries/submit", {
    method: "POST",
    json: {
      office_id: payload.officeId,
      subject: payload.subject,
      message: payload.message,
      concern_type_id: payload.concernTypeId,
      other_concern: payload.otherConcern,
    },
  });

  return response.inquiry_id;
}

export async function loadCounselingSessions() {
  const response = await requestJson<{ success: boolean; sessions: any[] }>("/api/mobile/counseling/sessions", {
    method: "GET",
  });

  return response.sessions.map(mapCounselingSession);
}

export async function loadCounselingSession(sessionId: number) {
  const response = await requestJson<{ success: boolean; session: any }>(
    `/api/mobile/counseling/session/${sessionId}`,
    {
      method: "GET",
    }
  );

  return mapCounselingSession(response.session);
}

export async function submitCounselingFeedback(sessionId: number, message: string) {
  const response = await requestJson<{ success: boolean; message: string }>(
    `/api/mobile/counseling/session/${sessionId}/feedback`,
    {
      method: "POST",
      body: { message },
    }
  );

  return response;
}

export async function loadCounselingOffices() {
  const response = await requestJson<{ success: boolean; offices: any[] }>("/api/mobile/counseling/offices", {
    method: "GET",
  });

  return response.offices.map((raw) => ({
    id: raw.id,
    name: raw.name,
    description: raw.description,
  }));
}

export async function loadOfficeAvailability(officeId: number, date: string) {
  const response = await requestJson<{ success: boolean; slots: any[] }>(
    `/api/mobile/counseling/office/${officeId}/availability?date=${encodeURIComponent(date)}`,
    {
      method: "GET",
    }
  );

  return response.slots;
}

export async function submitCounselingRequest(payload: {
  officeId: number;
  date: string;
  time: string;
  notes?: string;
  natureOfConcernId?: number;
  isVideo?: boolean;
}) {
  const response = await requestJson<{ success: boolean; message: string; session: any }>(
    "/api/mobile/counseling/request",
    {
      method: "POST",
      json: {
        office_id: payload.officeId,
        date: payload.date,
        time: payload.time,
        notes: payload.notes,
        nature_of_concern_id: payload.natureOfConcernId,
        is_video: payload.isVideo ?? true,
      },
    }
  );

  return mapCounselingSession(response.session);
}

export async function cancelCounselingSession(sessionId: number) {
  await requestJson(`/api/mobile/counseling/session/${sessionId}/cancel`, {
    method: "POST",
  });
}