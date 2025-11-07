export type IntentLabel =
  | "task.create"
  | "task.list"
  | "reminder.create"
  | "reminder.list"
  | "calendar.create"
  | "email.send"
  | "meeting.schedule"
  | "email.write"
  | "grocery.list"
  | "file.summarize"
  | "math.calculate"
  | "room.reserve"
  | "unknown";

export interface IntentResult {
  intent: IntentLabel;
  parameters: Record<string, unknown>;
  confidence?: number;
}
