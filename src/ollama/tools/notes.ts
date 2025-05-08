import { ToolFunction } from "../toolsLoader";
import connectDB from "../../lib/mongodb";
import Note from "../../models/Note";
import NotesIndex from "../../models/NotesIndex";
import mongoose from "mongoose";

// Default user ID for development/testing - matching the one used in notesIndex.ts
const DEFAULT_USER_ID = "6461247a5c17c979a3e7e43a"; // Replace with a valid MongoDB ObjectId

// Helper function to validate and convert userId to ObjectId
async function validateUserId(userId: string = DEFAULT_USER_ID) {
  await connectDB();
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error(`Invalid userId format: ${userId}. Must be a 24 character hex string.`);
  }
  
  return new mongoose.Types.ObjectId(userId);
}

// Helper function to find a note by its title
async function findNoteByTitle(title: string, userId: mongoose.Types.ObjectId) {
  return await Note.findOne({ title: { $regex: new RegExp(`^${title}$`, "i") }, userId });
}

const functions: ToolFunction[] = [
  {
    type: "function",
    function: {
      name: "writeNote",
      description: "Save a note with the specified title and content. If the note already exists, it will be updated.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Title of the note to save",
          },
          content: {
            type: "string",
            description: "Content of the note to save",
          },
          userId: {
            type: "string",
            description: "Optional: ID of the user. Uses default if not provided.",
          },
        },
        required: ["title", "content"],
      },
    },
    execute: async ({ title, content, userId = DEFAULT_USER_ID }: 
      { title: string; content: string; userId?: string }) => {
      try {
        const objectId = await validateUserId(userId);
        
        // Check if a note with this title already exists
        let note = await findNoteByTitle(title, objectId);
        
        if (note) {
          // Update existing note
          note.content = content;
          note.updatedAt = new Date();
        } else {
          // Create new note
          note = new Note({
            userId: objectId,
            title,
            content,
          });
          
          // Also add to notes index if it doesn't exist there
          await ensureNoteInIndex(title, userId);
        }
        
        await note.save();
        
        return {
          success: true,
          message: `Note '${title}' saved successfully`,
          title,
          isNew: !note.createdAt || note.createdAt === note.updatedAt,
        };
      } catch (error) {
        console.error("Error saving note:", error);
        throw new Error(`Failed to save note: ${error.message}`);
      }
    },
  },
  {
    type: "function",
    function: {
      name: "readNote",
      description: "Read a note's content by its title",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Title of the note to read",
          },
          userId: {
            type: "string",
            description: "Optional: ID of the user. Uses default if not provided.",
          },
        },
        required: ["title"],
      },
    },
    execute: async ({ title, userId = DEFAULT_USER_ID }: 
      { title: string; userId?: string }) => {
      try {
        const objectId = await validateUserId(userId);
        
        // Find the note by title
        const note = await findNoteByTitle(title, objectId);
        
        if (!note) {
          return {
            success: false,
            message: `Note '${title}' not found`,
            title,
          };
        }
        
        return {
          success: true,
          message: `Note '${title}' retrieved successfully`,
          note: {
            title: note.title,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          },
        };
      } catch (error) {
        console.error("Error reading note:", error);
        throw new Error(`Failed to read note: ${error.message}`);
      }
    },
  },
  {
    type: "function",
    function: {
      name: "searchNotes",
      description: "Search for notes by content or title",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query to find in note titles or content",
          },
          userId: {
            type: "string",
            description: "Optional: ID of the user. Uses default if not provided.",
          },
        },
        required: ["query"],
      },
    },
    execute: async ({ query, userId = DEFAULT_USER_ID }: 
      { query: string; userId?: string }) => {
      try {
        const objectId = await validateUserId(userId);
        
        // Search for notes containing the query in title or content
        const notes = await Note.find(
          { 
            userId: objectId,
            $or: [
              { title: { $regex: query, $options: "i" } },
              { content: { $regex: query, $options: "i" } }
            ]
          },
          { title: 1, createdAt: 1, updatedAt: 1, content: 1 }
        ).sort({ updatedAt: -1 });
        
        if (notes.length === 0) {
          return {
            success: false,
            message: `No notes found matching '${query}'`,
            query,
          };
        }
        
        return {
          success: true,
          message: `Found ${notes.length} notes matching '${query}'`,
          notes: notes.map(note => ({
            title: note.title,
            snippet: note.content.length > 100 
              ? note.content.substring(0, 100) + "..." 
              : note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          })),
          query,
        };
      } catch (error) {
        console.error("Error searching notes:", error);
        throw new Error(`Failed to search notes: ${error.message}`);
      }
    },
  }
];

// Helper function to ensure a note title is in the index
async function ensureNoteInIndex(title: string, userId: string = DEFAULT_USER_ID) {
  try {
    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error(`Invalid userId format: ${userId}. Must be a 24 character hex string.`);
    }
    
    const objectId = new mongoose.Types.ObjectId(userId);
    
    // Find existing index or create a new one
    let notesIndex = await NotesIndex.findOne({ userId: objectId });
    
    if (!notesIndex) {
      notesIndex = new NotesIndex({
        userId: objectId,
        fields: new Map(),
      });
    }
    
    // Check if this title is already in the index fields
    const titleExists = Array.from(notesIndex.fields.values()).some(
      value => value.toLowerCase() === title.toLowerCase()
    );
    
    if (!titleExists) {
      // Generate a unique field name using timestamp
      const fieldName = `note_${Date.now()}`;
      
      // Add the note title to the index
      notesIndex.fields.set(fieldName, title);
      await notesIndex.save();
    }
    
    return true;
  } catch (error) {
    console.error("Error ensuring note in index:", error);
    return false;
  }
}

export default functions;