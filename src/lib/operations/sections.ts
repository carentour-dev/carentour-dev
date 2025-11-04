import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  CalendarDays,
  Inbox,
  LayoutDashboard,
  Plane,
  Users,
} from "lucide-react";

import type { OperationsSectionId } from "@/lib/operations/types";
import type { AccessRequirement, EntitlementContext } from "./entitlements";
import {
  OPERATIONS_ACCESS_PERMISSION,
  OPERATIONS_SHARED_PERMISSION,
  satisfiesRequirement,
} from "./entitlements";

export type OperationsSectionConfig = {
  id: OperationsSectionId;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  adminHref: string;
  required: AccessRequirement;
};

const overviewRequirement: AccessRequirement = [
  { anyPermissions: [OPERATIONS_ACCESS_PERMISSION] },
  {
    anyPermissions: [
      "operations.requests",
      "operations.start_journey",
      "operations.consultations",
      "operations.appointments",
      "operations.patients",
    ],
  },
];

const sectionRequirement = (permission: string): AccessRequirement => ({
  allPermissions: [OPERATIONS_SHARED_PERMISSION, permission],
});

export const OPERATIONS_SECTIONS: OperationsSectionConfig[] = [
  {
    id: "overview",
    label: "Overview",
    description:
      "Monitor operational activity and jump into the areas that need your attention.",
    href: "/operations",
    icon: LayoutDashboard,
    adminHref: "/admin",
    required: overviewRequirement,
  },
  {
    id: "requests",
    label: "Requests",
    description:
      "Review new patient inquiries, track statuses, and capture coordinator notes.",
    href: "/operations/requests",
    icon: Inbox,
    adminHref: "/admin/requests",
    required: sectionRequirement("operations.requests"),
  },
  {
    id: "start-journey",
    label: "Start Journey",
    description:
      "Triage Start Journey submissions, assign ownership, and manage follow-up tasks.",
    href: "/operations/start-journey",
    icon: Plane,
    adminHref: "/admin/start-journey",
    required: sectionRequirement("operations.start_journey"),
  },
  {
    id: "consultations",
    label: "Consultations",
    description:
      "Schedule consultations, surface patient context, and coordinate physician availability.",
    href: "/operations/consultations",
    icon: CalendarCheck,
    adminHref: "/admin/consultations",
    required: sectionRequirement("operations.consultations"),
  },
  {
    id: "appointments",
    label: "Appointments",
    description:
      "Manage upcoming appointments, logistics, and post-visit follow-up plans.",
    href: "/operations/appointments",
    icon: CalendarDays,
    adminHref: "/admin/appointments",
    required: sectionRequirement("operations.appointments"),
  },
  {
    id: "patients",
    label: "Patients",
    description:
      "Create patient records, manage intake details, and configure portal access.",
    href: "/operations/patients",
    icon: Users,
    adminHref: "/admin/patients",
    required: sectionRequirement("operations.patients"),
  },
];

export const OPERATIONS_SECTION_MAP: Record<
  OperationsSectionId,
  OperationsSectionConfig
> = OPERATIONS_SECTIONS.reduce(
  (acc, section) => {
    acc[section.id] = section;
    return acc;
  },
  {} as Record<OperationsSectionId, OperationsSectionConfig>,
);

export const getAccessibleOperationsSections = (
  context: EntitlementContext,
  options: { includeOverview?: boolean } = {},
) => {
  const includeOverview = options.includeOverview ?? true;

  return OPERATIONS_SECTIONS.filter((section) => {
    if (!includeOverview && section.id === "overview") {
      return false;
    }
    return satisfiesRequirement(context, section.required);
  });
};

export const hasAnyOperationsSection = (context: EntitlementContext) => {
  return getAccessibleOperationsSections(context, {
    includeOverview: false,
  }).length
    ? true
    : false;
};
