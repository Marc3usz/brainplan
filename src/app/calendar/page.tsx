// src/app/calendar/test/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useAuthState } from  'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import googleCalendarService from './googleCalendar';

export default function CalendarTestPage() {
  const [user, loading] = useAuthState(auth);
  const [initialized, setInitialized] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [testStatus, setTestStatus] = useState<Record<string, { success: boolean; message: string }>>({});
  const [newEventData, setNewEventData] = useState({
    title: 'Test Event',
    description: 'This is a test event',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    location: 'Test Location'
  });
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      initializeCalendar();
    }
  }, [user, loading]);

  useEffect(() => {
    // Ustawienie dzisiejszej daty jako domyślnej
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setNewEventData(prev => ({
      ...prev,
      startDate: formattedDate,
      endDate: formattedDate
    }));
  }, []);

  const initializeCalendar = async () => {
    try {
      await googleCalendarService.initGoogleAuth();
      setInitialized(true);
      updateTestStatus('initialize', true, 'Google Calendar API zainicjalizowane pomyślnie');
    } catch (error) {
      updateTestStatus('initialize', false, `Błąd inicjalizacji: ${error.message}`);
    }
  };

  const handleAuthorize = async () => {
    try {
      await googleCalendarService.authorize();
      setAuthorized(true);
      updateTestStatus('authorize', true, 'Autoryzacja pomyślna');
    } catch (error) {
      console.error('Błąd autoryzacji:', error);
      updateTestStatus('authorize', false, `Błąd autoryzacji: ${error.message}`);
    }
  };

  const fetchCalendars = async () => {
    try {
      const result = await googleCalendarService.getCalendarsList();
      setCalendars(result);
      updateTestStatus('fetchCalendars', true, `Pobrano ${result.length} kalendarzy`);
    } catch (error) {
      console.error('Błąd pobierania kalendarzy:', error);
      updateTestStatus('fetchCalendars', false, `Błąd pobierania kalendarzy: ${error.message}`);
    }
  };

  const fetchEvents = async () => {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      const result = await googleCalendarService.getEvents('primary', startDate, endDate);
      setEvents(result);
      updateTestStatus('fetchEvents', true, `Pobrano ${result.length} wydarzeń`);
    } catch (error) {
      console.error('Błąd pobierania wydarzeń:', error);
      updateTestStatus('fetchEvents', false, `Błąd pobierania wydarzeń: ${error.message}`);
    }
  };

  const createTestEvent = async () => {
    try {
      const { title, description, startDate, startTime, endDate, endTime, location } = newEventData;
      
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      const eventData = {
        summary: title,
        description,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location
      };
      
      const result = await googleCalendarService.createEvent('primary', eventData);
      setCreatedEventId(result.id);
      updateTestStatus('createEvent', true, `Wydarzenie utworzone pomyślnie, ID: ${result.id}`);
      
      // Odśwież listę wydarzeń
      await fetchEvents();
    } catch (error) {
      console.error('Błąd tworzenia wydarzenia:', error);
      updateTestStatus('createEvent', false, `Błąd tworzenia wydarzenia: ${error.message}`);
    }
  };

  const updateTestEvent = async () => {
    if (!createdEventId) {
      updateTestStatus('updateEvent', false, 'Brak ID wydarzenia do aktualizacji');
      return;
    }
    
    try {
      const { title, description, startDate, startTime, endDate, endTime, location } = newEventData;
      
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      const eventData = {
        summary: `${title} (zaktualizowano)`,
        description: `${description} (zaktualizowano)`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: `${location} (zaktualizowano)`
      };
      
      await googleCalendarService.updateEvent('primary', createdEventId, eventData);
      updateTestStatus('updateEvent', true, 'Wydarzenie zaktualizowane pomyślnie');
      
      // Odśwież listę wydarzeń
      await fetchEvents();
    } catch (error) {
      console.error('Błąd aktualizacji wydarzenia:', error);
      updateTestStatus('updateEvent', false, `Błąd aktualizacji wydarzenia: ${error.message}`);
    }
  };

  const deleteTestEvent = async () => {
    if (!createdEventId) {
      updateTestStatus('deleteEvent', false, 'Brak ID wydarzenia do usunięcia');
      return;
    }
    
    try {
      await googleCalendarService.deleteEvent('primary', createdEventId);
      updateTestStatus('deleteEvent', true, 'Wydarzenie usunięte pomyślnie');
      setCreatedEventId(null);
      
      // Odśwież listę wydarzeń
      await fetchEvents();
    } catch (error) {
      console.error('Błąd usuwania wydarzenia:', error);
      updateTestStatus('deleteEvent', false, `Błąd usuwania wydarzenia: ${error.message}`);
    }
  };

  const updateTestStatus = (key: string, success: boolean, message: string) => {
    setTestStatus(prev => ({
      ...prev,
      [key]: { success, message }
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <div className="p-8">Ładowanie...</div>;
  }

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test integracji z Google Calendar</h1>
        <p>Aby przetestować integrację, musisz się najpierw zalogować.</p>
        <a href="/login" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">
          Przejdź do logowania
        </a>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test integracji z Google Calendar</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">1. Inicjalizacja i autoryzacja</h2>
        
        <div className="space-y-4">
          <div>
            <button 
              onClick={initializeCalendar}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              disabled={initialized}
            >
              Inicjalizuj Google Calendar API
            </button>
            
            {testStatus.initialize && (
              <span className={`ml-2 ${testStatus.initialize.success ? 'text-green-500' : 'text-red-500'}`}>
                {testStatus.initialize.message}
              </span>
            )}
          </div>
          
          <div>
            <button 
              onClick={handleAuthorize}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              disabled={!initialized || authorized}
            >
              Autoryzuj z Google Calendar
            </button>
            
            {testStatus.authorize && (
              <span className={`ml-2 ${testStatus.authorize.success ? 'text-green-500' : 'text-red-500'}`}>
                {testStatus.authorize.message}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">2. Pobieranie danych</h2>
        
        <div className="space-y-4">
          <div>
            <button 
              onClick={fetchCalendars}
              className="bg-green-500 text-white px-4 py-2 rounded mr-2"
              disabled={!authorized}
            >
              Pobierz listę kalendarzy
            </button>
            
            {testStatus.fetchCalendars && (
              <span className={`ml-2 ${testStatus.fetchCalendars.success ? 'text-green-500' : 'text-red-500'}`}>
                {testStatus.fetchCalendars.message}
              </span>
            )}
          </div>
          
          {calendars.length > 0 && (
            <div className="mt-2">
              <h3 className="font-semibold mb-2">Znalezione kalendarze:</h3>
              <ul className="list-disc list-inside">
                {calendars.map((calendar) => (
                  <li key={calendar.id}>{calendar.summary} ({calendar.id})</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <button 
              onClick={fetchEvents}
              className="bg-green-500 text-white px-4 py-2 rounded mr-2"
              disabled={!authorized}
            >
              Pobierz wydarzenia
            </button>
            
            {testStatus.fetchEvents && (
              <span className={`ml-2 ${testStatus.fetchEvents.success ? 'text-green-500' : 'text-red-500'}`}>
                {testStatus.fetchEvents.message}
              </span>
            )}
          </div>
          
          {events.length > 0 && (
            <div className="mt-2">
              <h3 className="font-semibold mb-2">Znalezione wydarzenia:</h3>
              <ul className="list-disc list-inside">
                {events.map((event) => (
                  <li key={event.id}>{event.summary} ({new Date(event.start.dateTime || event.start.date).toLocaleString()})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">3. Zarządzanie wydarzeniami</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł</label>
              <input
                type="text"
                name="title"
                value={newEventData.title}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokalizacja</label>
              <input
                type="text"
                name="location"
                value={newEventData.location}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data rozpoczęcia</label>
              <input
                type="date"
                name="startDate"
                value={newEventData.startDate}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Godzina rozpoczęcia</label>
              <input
                type="time"
                name="startTime"
                value={newEventData.startTime}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data zakończenia</label>
              <input
                type="date"
                name="endDate"
                value={newEventData.endDate}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Godzina zakończenia</label>
              <input
                type="time"
                name="endTime"
                value={newEventData.endTime}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
              <textarea
                name="description"
                value={newEventData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={createTestEvent}
              className="bg-purple-500 text-white px-4 py-2 rounded"
              disabled={!authorized}
            >
              Utwórz testowe wydarzenie
            </button>
            
            <button 
              onClick={updateTestEvent}
              className="bg-yellow-500 text-white px-4 py-2 rounded"
              disabled={!authorized || !createdEventId}
            >
              Zaktualizuj wydarzenie
            </button>
            
            <button 
              onClick={deleteTestEvent}
              className="bg-red-500 text-white px-4 py-2 rounded"
              disabled={!authorized || !createdEventId}
            >
              Usuń wydarzenie
            </button>
          </div>
          
          {testStatus.createEvent && (
            <div className={`mt-2 ${testStatus.createEvent.success ? 'text-green-500' : 'text-red-500'}`}>
              {testStatus.createEvent.message}
            </div>
          )}
          
          {testStatus.updateEvent && (
            <div className={`mt-2 ${testStatus.updateEvent.success ? 'text-green-500' : 'text-red-500'}`}>
              {testStatus.updateEvent.message}
            </div>
          )}
          
          {testStatus.deleteEvent && (
            <div className={`mt-2 ${testStatus.deleteEvent.success ? 'text-green-500' : 'text-red-500'}`}>
              {testStatus.deleteEvent.message}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6">
        <a href="/calendar" className="bg-blue-500 text-white px-4 py-2 rounded">
          Przejdź do pełnego widoku kalendarza
        </a>
      </div>
    </div>
  );
}