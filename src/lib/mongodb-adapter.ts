import { MongoClient, ObjectId } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise; 


// src/app/calendar/mongodb-adapter.ts

import { db } from '../lib/mongodb';

export interface CalendarEvent {
  _id?: ObjectId;
  userId: string;
  googleEventId: string;
  calendarId: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
  googleEventData?: any;
}

export class CalendarMongoDBAdapter {
  private db: any;
  private collection: string = 'calendar_events';

  constructor() {
    this.db = db;
  }

  // Pobieranie wydarzeń dla użytkownika
  async getEventsByUserId(userId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    try {
      let query: any = { userId };
      
      if (startDate || endDate) {
        query.start = {};
        
        if (startDate) {
          query.start.$gte = startDate;
        }
        
        if (endDate) {
          query.start.$lte = endDate;
        }
      }
      
      const events = await this.db.collection(this.collection)
        .find(query)
        .sort({ start: 1 })
        .toArray();
      
      return events;
    } catch (error) {
      console.error('Błąd podczas pobierania wydarzeń z MongoDB:', error);
      throw error;
    }
  }

  // Pobieranie wydarzenia po ID
  async getEventById(eventId: string): Promise<CalendarEvent | null> {
    try {
      const event = await this.db.collection(this.collection)
        .findOne({ _id: new ObjectId(eventId) });
      
      return event;
    } catch (error) {
      console.error('Błąd podczas pobierania wydarzenia z MongoDB:', error);
      throw error;
    }
  }

  // Pobieranie wydarzenia po Google Event ID
  async getEventByGoogleId(userId: string, googleEventId: string): Promise<CalendarEvent | null> {
    try {
      const event = await this.db.collection(this.collection)
        .findOne({ userId, googleEventId });
      
      return event;
    } catch (error) {
      console.error('Błąd podczas pobierania wydarzenia po Google ID z MongoDB:', error);
      throw error;
    }
  }

  // Tworzenie nowego wydarzenia
  async createEvent(eventData: CalendarEvent): Promise<string> {
    try {
      const result = await this.db.collection(this.collection)
        .insertOne({
          ...eventData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      
      return result.insertedId.toString();
    } catch (error) {
      console.error('Błąd podczas tworzenia wydarzenia w MongoDB:', error);
      throw error;
    }
  }

  // Aktualizacja wydarzenia
  async updateEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<boolean> {
    try {
      const result = await this.db.collection(this.collection)
        .updateOne(
          { _id: new ObjectId(eventId) },
          { 
            $set: {
              ...eventData,
              updatedAt: new Date()
            }
          }
        );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Błąd podczas aktualizacji wydarzenia w MongoDB:', error);
      throw error;
    }
  }

  // Aktualizacja wydarzenia po Google Event ID
  async updateEventByGoogleId(userId: string, googleEventId: string, eventData: Partial<CalendarEvent>): Promise<boolean> {
    try {
      const result = await this.db.collection(this.collection)
        .updateOne(
          { userId, googleEventId },
          { 
            $set: {
              ...eventData,
              updatedAt: new Date()
            }
          }
        );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Błąd podczas aktualizacji wydarzenia po Google ID w MongoDB:', error);
      throw error;
    }
  }

  // Usuwanie wydarzenia
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const result = await this.db.collection(this.collection)
        .deleteOne({ _id: new ObjectId(eventId) });
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Błąd podczas usuwania wydarzenia z MongoDB:', error);
      throw error;
    }
  }

  // Usuwanie wydarzenia po Google Event ID
  async deleteEventByGoogleId(userId: string, googleEventId: string): Promise<boolean> {
    try {
      const result = await this.db.collection(this.collection)
        .deleteOne({ userId, googleEventId });
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Błąd podczas usuwania wydarzenia po Google ID z MongoDB:', error);
      throw error;
    }
  }

  // Synchronizacja wydarzeń
  async syncEvents(userId: string, events: any[], calendarId: string): Promise<void> {
    try {
      // Pobierz wszystkie wydarzenia dla tego użytkownika i kalendarza
      const existingEvents = await this.db.collection(this.collection)
        .find({ userId, calendarId })
        .toArray();
      
      const existingGoogleIds = new Set(existingEvents.map(event => event.googleEventId));
      const currentGoogleIds = new Set(events.map(event => event.id));
      
      // Operacje wsadowe
      const bulkOps = [];
      
      // Dodaj lub zaktualizuj wydarzenia
      for (const event of events) {
        const eventData = {
          userId,
          calendarId,
          googleEventId: event.id,
          title: event.summary,
          description: event.description || '',
          start: new Date(event.start.dateTime || event.start.date),
          end: new Date(event.end.dateTime || event.end.date),
          location: event.location || '',
          updatedAt: new Date(),
          googleEventData: event
        };
        
        if (existingGoogleIds.has(event.id)) {
          // Aktualizacja istniejącego wydarzenia
          bulkOps.push({
            updateOne: {
              filter: { userId, googleEventId: event.id },
              update: { $set: eventData }
            }
          });
        } else {
          // Dodanie nowego wydarzenia
          bulkOps.push({
            insertOne: {
              document: {
                ...eventData,
                createdAt: new Date()
              }
            }
          });
        }
      }
      
      // Usunięcie wydarzeń, które nie istnieją już w Google Calendar
      for (const event of existingEvents) {
        if (!currentGoogleIds.has(event.googleEventId)) {
          bulkOps.push({
            deleteOne: {
              filter: { _id: event._id }
            }
          });
        }
      }
      
      // Wykonaj operacje wsadowe, jeśli są
      if (bulkOps.length > 0) {
        await this.db.collection(this.collection).bulkWrite(bulkOps);
      }
    } catch (error) {
      console.error('Błąd podczas synchronizacji wydarzeń z MongoDB:', error);
      throw error;
    }
  }
}
