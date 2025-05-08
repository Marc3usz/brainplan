'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay } from 'date-fns';

interface Event {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    date?: string;
  };
  end: {
    dateTime: string;
    date?: string;
  };
}

interface CalendarProps {
  accessToken?: string | null;
}

export default function Calendar({ accessToken }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get all days in the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of the week the month starts on (0 = Sunday, 6 = Saturday)
  const startDay = getDay(monthStart);
  
  // Calculate calendar days with empty slots for previous month
  const calendarDays = Array(startDay).fill(null).concat(monthDays);

  // Fetch calendar events for the current month
  const fetchEvents = async () => {
    // Skip if no access token
    if (!accessToken) {
      setError('No access token available');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const timeMin = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const timeMax = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch events');
      }
      
      const data = await response.json();
      setEvents(data.items || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };
  
  // Load events when month changes or accessToken becomes available
  useEffect(() => {
    if (accessToken) {
      fetchEvents();
    }
  }, [currentDate, accessToken]);

  // Clear error when accessToken changes
  useEffect(() => {
    if (accessToken) {
      setError('');
    } else {
      setError('No access token available. Please sign in to view your calendar.');
    }
  }, [accessToken]);

  // Check if a date has events
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = event.start.dateTime 
        ? new Date(event.start.dateTime) 
        : event.start.date ? new Date(event.start.date) : null;
        
      return eventStart && isSameDay(date, eventStart);
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="rounded-lg shadow-md bg-white dark:bg-gray-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={previousMonth}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Previous month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Next month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button 
            onClick={fetchEvents}
            className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center"
            aria-label="Refresh calendar"
            disabled={loading || !accessToken}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="text-center py-4">
          <svg className="animate-spin h-6 w-6 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {error && !loading && (
        <div className="text-red-500 dark:text-red-400 mb-4 text-center">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={index} className="text-center font-medium text-gray-600 dark:text-gray-400 text-sm py-2">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-10 sm:h-14 text-center py-1"></div>;
          }
          
          const dayEvents = getEventsForDate(day);
          const hasEvents = dayEvents.length > 0;
          
          return (
            <div 
              key={day.toString()} 
              className={`h-10 sm:h-14 p-1 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition relative ${
                !isSameMonth(day, currentDate) ? 'text-gray-400 dark:text-gray-600' :
                isToday(day) ? 'bg-blue-100 dark:bg-blue-900/30 font-bold' : ''
              }`}
            >
              <div className="text-sm sm:text-base">{format(day, 'd')}</div>
              {hasEvents && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    isToday(day) ? 'bg-blue-600' : 'bg-green-500'
                  }`}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Events list */}
      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
          {events.length > 0 ? 'Events this month' : 'No events this month'}
        </h3>
        <ul className="space-y-2">
          {events.slice(0, 3).map(event => (
            <li key={event.id} className="flex items-start p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 mr-2"></div>
              <div>
                <div className="font-medium text-gray-800 dark:text-white">
                  {event.summary}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(event.start.dateTime || event.start.date || ''), 'MMM d, h:mm a')}
                </div>
              </div>
            </li>
          ))}
          {events.length > 3 && (
            <li className="text-sm text-blue-600 dark:text-blue-400 pt-1">
              + {events.length - 3} more events
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}