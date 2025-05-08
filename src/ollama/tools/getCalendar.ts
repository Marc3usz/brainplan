import { ToolFunction } from "../toolsLoader";
import { format, parseISO } from "date-fns";

// Google Calendar event interface
interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  status: string;
  created: string;
  updated: string;
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
}

// Calendar response interface
interface CalendarResponse {
  items: CalendarEvent[];
  summary: string;
  description?: string;
  timeZone?: string;
  updated: string;
  nextPageToken?: string;
}

// Get the user's OAuth access token from browser storage
function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("accessToken");
  }
  return null;
}

// Format a calendar event to a readable string
function formatEvent(event: CalendarEvent): string {
  try {
    // Get event date/time
    const startDateTime = event.start.dateTime || event.start.date;
    const endDateTime = event.end.dateTime || event.end.date;
    
    if (!startDateTime) {
      return `[Invalid event: ${event.summary || "No title"}]`;
    }

    // Format date and time
    const startDate = parseISO(startDateTime);
    const formattedStart = format(startDate, "EEE, MMM d, yyyy 'at' h:mm a");
    
    // Format duration if end time exists
    let duration = "";
    if (endDateTime) {
      const endDate = parseISO(endDateTime);
      if (format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd")) {
        // Same day event
        duration = ` - ${format(endDate, "h:mm a")}`;
      } else {
        // Multi-day event
        duration = ` - ${format(endDate, "EEE, MMM d 'at' h:mm a")}`;
      }
    }
    
    // Build the event string
    let eventString = `📅 ${event.summary || "Untitled Event"}\n`;
    eventString += `   When: ${formattedStart}${duration}\n`;
    
    if (event.location) {
      eventString += `   Where: ${event.location}\n`;
    }
    
    if (event.description) {
      const truncatedDescription = event.description.length > 100 
        ? `${event.description.substring(0, 97)}...` 
        : event.description;
      eventString += `   Details: ${truncatedDescription}\n`;
    }
    
    // Add attendees if available (limited to 3 for readability)
    if (event.attendees && event.attendees.length > 0) {
      const attendeeCount = event.attendees.length;
      const displayAttendees = event.attendees.slice(0, 3);
      const attendeeList = displayAttendees
        .map(a => a.displayName || a.email)
        .join(", ");
      
      eventString += `   Attendees: ${attendeeList}`;
      if (attendeeCount > 3) {
        eventString += ` and ${attendeeCount - 3} more`;
      }
      eventString += "\n";
    }
    
    return eventString;
  } catch (error) {
    console.error("Error formatting event:", error);
    return `[Error formatting event: ${event.summary || "Unknown event"}]`;
  }
}

// Format a calendar response to a readable string
function formatCalendarResponse(calendar: CalendarResponse): string {
  if (!calendar.items || calendar.items.length === 0) {
    return "No upcoming events found in your calendar.";
  }
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  // Group events by date
  const todayEvents: CalendarEvent[] = [];
  const tomorrowEvents: CalendarEvent[] = [];
  const upcomingEvents: CalendarEvent[] = [];
  
  calendar.items.forEach(event => {
    const startDateTime = event.start.dateTime || event.start.date;
    if (!startDateTime) return;
    
    const eventDate = parseISO(startDateTime);
    
    if (format(eventDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
      todayEvents.push(event);
    } else if (format(eventDate, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd")) {
      tomorrowEvents.push(event);
    } else {
      upcomingEvents.push(event);
    }
  });
  
  let result = `Calendar: ${calendar.summary}\n\n`;
  
  if (todayEvents.length > 0) {
    result += "TODAY'S EVENTS:\n";
    result += todayEvents.map(formatEvent).join("\n");
    result += "\n\n";
  }
  
  if (tomorrowEvents.length > 0) {
    result += "TOMORROW'S EVENTS:\n";
    result += tomorrowEvents.map(formatEvent).join("\n");
    result += "\n\n";
  }
  
  if (upcomingEvents.length > 0) {
    result += "UPCOMING EVENTS:\n";
    result += upcomingEvents.slice(0, 5).map(formatEvent).join("\n");
    
    if (upcomingEvents.length > 5) {
      result += `\n...and ${upcomingEvents.length - 5} more upcoming events.`;
    }
  }
  
  return result;
}

// Generate fallback mock calendar data if no token available (for testing purposes)
function generateFallbackCalendarData() {
  const currentDate = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  
  // Create mock calendar events
  const events: CalendarEvent[] = [
    {
      id: "event_1",
      summary: "Weekly Team Meeting",
      description: "Discuss project progress and upcoming tasks",
      location: "Conference Room A",
      start: {
        dateTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 10, 0, 0, 0).toISOString(),
        timeZone,
      },
      end: {
        dateTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 11, 0, 0, 0).toISOString(),
        timeZone,
      },
      status: "confirmed",
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
  ];

  return {
    items: events,
    summary: "Demo Calendar (No Auth)",
    timeZone,
    updated: new Date().toISOString()
  };
}

const functions: ToolFunction[] = [
  {
    type: "function",
    function: {
      name: "getCalendar",
      description: "Gets the user's upcoming Google Calendar events and displays them in a readable format. Shows today's events, tomorrow's events, and upcoming events.",
    },
    execute: async (args?: string): Promise<{ value: string }> => {
      try {
        // First try to get token from arguments if provided
        let accessToken = null;
        
        if (args) {
          try {
            const parsedArgs = JSON.parse(args);
            if (parsedArgs.accessToken) {
              accessToken = parsedArgs.accessToken;
            }
          } catch (e) {
            console.error("Error parsing getCalendar args:", e);
          }
        }
        
        // If no token in args, try to get from browser storage (for client-side usage)
        if (!accessToken) {
          accessToken = getAccessToken();
        }
        
        // If still no access token is available
        if (!accessToken) {
          return {
            value: "⚠️ You're not connected to Google Calendar. Please connect your Google Calendar in the dashboard to see your events."
          };
        }
        
        // Fetch upcoming events from the user's primary calendar
        const timeMin = new Date().toISOString();
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=20&singleEvents=true&orderBy=startTime`;
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            return {
              value: "⚠️ Your Google Calendar authorization has expired. Please reconnect your Google Calendar in the dashboard."
            };
          }
          
          throw new Error(`Google Calendar API returned status code ${response.status}`);
        }
        
        const calendarData: CalendarResponse = await response.json();
        const formattedCalendar = formatCalendarResponse(calendarData);
        
        return {
          value: formattedCalendar
        };
      } catch (error) {
        console.error("Error fetching calendar data:", error);
        
        if (error instanceof Error) {
          return {
            value: `Failed to fetch calendar data: ${error.message}. Please try again later or reconnect your Google Calendar.`
          };
        }
        
        return {
          value: "An unexpected error occurred while fetching your calendar data. Please try again later."
        };
      }
    },
  },
];

export default functions;
