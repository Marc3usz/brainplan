import { ToolFunction } from "../toolsLoader";

// Mock Google Calendar data structure based on the Calendar API
interface MockCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  status: string;
  created: string;
  updated: string;
  organizer: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
}

// Generate mock calendar data for a sample user
function generateMockCalendarData() {
  // Use the current date (May 7, 2025) as the base for creating events
  const currentDate = new Date(2025, 4, 7); // Month is 0-indexed, so 4 = May
  const timeZone = "America/New_York";
  
  // Helper function to format date in ISO format
  const formatDate = (date: Date): string => date.toISOString();
  
  // Helper to add days to a date
  const addDays = (date: Date, days: number): Date => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };
  
  // Helper to set time for a date
  const setTime = (date: Date, hours: number, minutes: number): Date => {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  // Create mock calendar events
  const events: MockCalendarEvent[] = [
    {
      id: "event_1",
      summary: "Weekly Team Meeting",
      description: "Discuss project progress and upcoming tasks",
      location: "Conference Room A",
      start: {
        dateTime: formatDate(setTime(currentDate, 10, 0)),
        timeZone,
      },
      end: {
        dateTime: formatDate(setTime(currentDate, 11, 0)),
        timeZone,
      },
      attendees: [
        {
          email: "john.doe@example.com",
          displayName: "John Doe",
          responseStatus: "accepted",
        },
        {
          email: "jane.smith@example.com",
          displayName: "Jane Smith",
          responseStatus: "accepted",
        },
      ],
      status: "confirmed",
      created: formatDate(addDays(currentDate, -10)),
      updated: formatDate(addDays(currentDate, -2)),
      organizer: {
        email: "user@example.com",
        displayName: "Mock User",
        self: true,
      },
    },
    {
      id: "event_2",
      summary: "Client Presentation",
      description: "Present quarterly project results to client",
      location: "Virtual Meeting",
      start: {
        dateTime: formatDate(setTime(addDays(currentDate, 1), 14, 0)),
        timeZone,
      },
      end: {
        dateTime: formatDate(setTime(addDays(currentDate, 1), 15, 30)),
        timeZone,
      },
      attendees: [
        {
          email: "client@clientcompany.com",
          displayName: "Client Contact",
          responseStatus: "accepted",
        },
        {
          email: "manager@example.com",
          displayName: "Team Manager",
          responseStatus: "accepted",
        },
      ],
      status: "confirmed",
      created: formatDate(addDays(currentDate, -14)),
      updated: formatDate(addDays(currentDate, -3)),
      organizer: {
        email: "user@example.com",
        displayName: "Mock User",
        self: true,
      },
    },
    {
      id: "event_3",
      summary: "Dentist Appointment",
      location: "Dental Clinic",
      start: {
        dateTime: formatDate(setTime(addDays(currentDate, 2), 9, 30)),
        timeZone,
      },
      end: {
        dateTime: formatDate(setTime(addDays(currentDate, 2), 10, 30)),
        timeZone,
      },
      status: "confirmed",
      created: formatDate(addDays(currentDate, -20)),
      updated: formatDate(addDays(currentDate, -20)),
      organizer: {
        email: "user@example.com",
        displayName: "Mock User",
        self: true,
      },
    },
    {
      id: "event_4",
      summary: "Project Deadline",
      description: "Final submission of project deliverables",
      start: {
        dateTime: formatDate(setTime(addDays(currentDate, 3), 17, 0)),
        timeZone,
      },
      end: {
        dateTime: formatDate(setTime(addDays(currentDate, 3), 17, 0)),
        timeZone,
      },
      status: "confirmed",
      created: formatDate(addDays(currentDate, -30)),
      updated: formatDate(addDays(currentDate, -5)),
      organizer: {
        email: "user@example.com",
        displayName: "Mock User",
        self: true,
      },
    },
    {
      id: "event_5",
      summary: "Birthday Party",
      description: "Celebration for team member's birthday",
      location: "Break Room",
      start: {
        dateTime: formatDate(setTime(addDays(currentDate, 4), 16, 0)),
        timeZone,
      },
      end: {
        dateTime: formatDate(setTime(addDays(currentDate, 4), 17, 0)),
        timeZone,
      },
      attendees: [
        {
          email: "team@example.com",
          displayName: "Whole Team",
          responseStatus: "accepted",
        },
      ],
      status: "confirmed",
      created: formatDate(addDays(currentDate, -7)),
      updated: formatDate(addDays(currentDate, -7)),
      organizer: {
        email: "hr@example.com",
        displayName: "HR Department",
        self: false,
      },
    },
  ];

  // Return calendar data in a format similar to Google Calendar API
  return {
    kind: "calendar#events",
    etag: "\"p32sd9fcvmuldo0g\"",
    summary: "Mock User's Calendar",
    description: "Calendar for Mock User",
    updated: formatDate(currentDate),
    timeZone,
    accessRole: "owner",
    defaultReminders: [
      {
        method: "email",
        minutes: 30,
      },
      {
        method: "popup",
        minutes: 15,
      },
    ],
    items: events,
  };
}

const functions: ToolFunction[] = [
  {
    type: "function",
    function: {
      name: "getCalendar",
      description: "Returns the google calendar data for the active user. Make sure to handle displaying the relevant data from the json. Make it easy to read and readable",
    },
    execute: async (): Promise<{ value: string }> => {
      try {
        // Generate mock calendar data
        const calendarData = generateMockCalendarData();
        
        // Return the calendar data as a JSON string
        return {
          value: JSON.stringify(calendarData, null, 2),
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to fetch calendar data: ${error.message}`);
        }
        throw new Error("Failed to fetch calendar data");
      }
    },
  },
];

export default functions;
