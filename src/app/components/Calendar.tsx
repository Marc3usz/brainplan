// src/app/calendar/components/Calendar.tsx

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import googleCalendarService from '../googleCalendar';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onSave: (event: CalendarEvent) => void;
  onDelete?: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, event, onSave, onDelete }) => {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startDate, setStartDate] = useState(event?.start ? format(event.start, "yyyy-MM-dd'T'HH:mm") : '');
  const [endDate, setEndDate] = useState(event?.end ? format(event.end, "yyyy-MM-dd'T'HH:mm") : '');
  const [location, setLocation] = useState(event?.location || '');

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setStartDate(format(event.start, "yyyy-MM-dd'T'HH:mm"));
      setEndDate(format(event.end, "yyyy-MM-dd'T'HH:mm"));
      setLocation(event.location || '');
    } else {
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setLocation('');
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      id: event?.id || '',
      title,
      description,
      start: new Date(startDate),
      end: new Date(endDate),
      location
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{event?.id ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              Tytuł
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Opis
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows={3}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="start">
              Data rozpoczęcia
            </label>
            <input
              id="start"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="end">
              Data zakończenia
            </label>
            <input
              id="end"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
              Lokalizacja
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="flex justify-between">
            <div>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Zapisz
              </button>
            </div>
            
            {event?.id && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Usuń
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const Calendar: React.FC = () => {
  const [user] = useAuthState(auth);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Inicjalizacja Google Calendar API
  useEffect(() => {
    const initCalendar = async () => {
      if (user) {
        try {
          await googleCalendarService.initGoogleAuth();
          setAuthorized(true);
          await fetchEvents();
        } catch (error) {
          console.error('Błąd inicjalizacji Google Calendar:', error);
          setAuthorized(false);
        } finally {
          setLoading(false);
        }
      }
    };

    initCalendar();
  }, [user]);

  // Pobieranie wydarzeń
  const fetchEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      
      const googleEvents = await googleCalendarService.getEvents('primary', startDate, endDate);
      
      // Konwersja wydarzeń Google do formatu naszej aplikacji
      const formattedEvents: CalendarEvent[] = googleEvents.map((event: any) => ({
        id: event.id,
        title: event.summary,
        description: event.description || '',
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        location: event.location || ''
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Błąd podczas pobierania wydarzeń:', error);
      
      // Jeśli błąd autoryzacji, ponowna próba
      if (error.response?.status === 401) {
        try {
          await googleCalendarService.authorize();
          setAuthorized(true);
          await fetchEvents();
        } catch (authError) {
          console.error('Błąd ponownej autoryzacji:', authError);
          setAuthorized(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Autoryzacja z Google Calendar
  const handleAuthorize = async () => {
    try {
      await googleCalendarService.authorize();
      setAuthorized(true);
      await fetchEvents();
    } catch (error) {
      console.error('Błąd autoryzacji:', error);
    }
  };

  // Zmiana miesiąca
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Zapisywanie wydarzenia
  const handleSaveEvent = async (eventData: CalendarEvent) => {
    try {
      // Format danych dla Google Calendar API
      const googleEventData = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: eventData.end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: eventData.location
      };
      
      if (eventData.id) {
        // Aktualizacja istniejącego wydarzenia
        await googleCalendarService.updateEvent('primary', eventData.id, googleEventData);
      } else {
        // Tworzenie nowego wydarzenia
        await googleCalendarService.createEvent('primary', googleEventData);
      }
      
      // Odświeżenie listy wydarzeń
      await fetchEvents();
    } catch (error) {
      console.error('Błąd podczas zapisywania wydarzenia:', error);
    }
  };

  // Usuwanie wydarzenia
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await googleCalendarService.deleteEvent('primary', selectedEvent.id);
      setIsModalOpen(false);
      setSelectedEvent(null);
      await fetchEvents();
    } catch (error) {
      console.error('Błąd podczas usuwania wydarzenia:', error);
    }
  };

  // Otwieranie modalu z istniejącym wydarzeniem
  const openEventModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // Otwieranie modalu z nowym wydarzeniem
  const openNewEventModal = (date: Date) => {
    const startDate = new Date(date);
    startDate.setHours(9, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(10, 0, 0, 0);
    
    setSelectedEvent({
      id: '',
      title: '',
      start: startDate,
      end: endDate,
      description: '',
      location: ''
    });
    
    setIsModalOpen(true);
  };

  // Generowanie widoku kalendarza
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const dateFormat = 'd';
    const rows = [];
    
    let days = [];
    let day = startDate;
    let formattedDate = '';
    
    // Nagłówki dni tygodnia
    const daysOfWeek = [];
    const dayHeaderFormat = 'EEEEEE';
    
    for (let i = 0; i < 7; i++) {
      const dayOfWeek = addDays(startDate, i);
      daysOfWeek.push(
        <div className="text-center font-bold p-2" key={i}>
          {format(dayOfWeek, dayHeaderFormat, { locale: pl })}
        </div>
      );
    }
    
    // Dni w kalendarzu
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dayEvents = events.filter(event => 
          isSameDay(new Date(event.start), cloneDay)
        );
        
        days.push(
          <div
            className={`min-h-24 p-2 border border-gray-200 ${
              !isSameMonth(day, monthStart) ? 'bg-gray-100 text-gray-400' : 'bg-white'
            } ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''} cursor-pointer`}
            key={day.toString()}
            onClick={() => openNewEventModal(cloneDay)}
          >
            <div className="flex justify-between">
              <span>{formattedDate}</span>
            </div>
            
            <div className="mt-1">
              {dayEvents.map((event, index) => (
                <div
                  key={index}
                  className="bg-blue-500 text-white p-1 mb-1 rounded text-sm truncate"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEventModal(event);
                  }}
                >
                  {format(new Date(event.start), 'HH:mm')} - {event.title}
                </div>
              ))}
            </div>
          </div>
        );
        
        day = addDays(day, 1);
      }
      
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      
      days = [];
    }
    
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center p-4 border-b">
          <button
            onClick={prevMonth}
            className="bg-gray-200 hover:bg-gray-300 rounded-full p-2"
          >
            &lt;
          </button>
          <h2 className="text-xl font-bold">
            {format(currentDate, 'LLLL yyyy', { locale: pl })}
          </h2>
          <button
            onClick={nextMonth}
            className="bg-gray-200 hover:bg-gray-300 rounded-full p-2"
          >
            &gt;
          </button>
        </div>
        
        <div className="grid grid-cols-7 border-b">
          {daysOfWeek}
        </div>
        
        <div>{rows}</div>
      </div>
    );
  };

  // Renderowanie głównego komponentu
  if (!user) {
    return <div className="text-center p-4">Zaloguj się, aby uzyskać dostęp do kalendarza</div>;
  }

  if (loading) {
    return <div className="text-center p-4">Ładowanie...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Kalendarz</h1>
      
      {!authorized ? (
        <div className="text-center p-4">
          <p className="mb-4">Połącz swoje konto z Google Calendar, aby zarządzać wydarzeniami</p>
          <button
            onClick={handleAuthorize}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Połącz z Google Calendar
          </button>
        </div>
      ) : (
        <>
          {renderCalendar()}
          
          <EventModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            event={selectedEvent}
            onSave={handleSaveEvent}
            onDelete={selectedEvent?.id ? handleDeleteEvent : undefined}
          />
        </>
      )}
    </div>
  );
};

export default Calendar;