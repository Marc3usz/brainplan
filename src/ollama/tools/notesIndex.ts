import { ToolFunction } from "../toolsLoader";
import connectDB from "../../lib/mongodb";
import NotesIndex from "../../models/NotesIndex";
import mongoose from "mongoose";

// Default user ID for development/testing - in production, you'll want to set this to your actual default user
const DEFAULT_USER_ID = "6461247a5c17c979a3e7e43a"; // Replace with a valid MongoDB ObjectId

// Helper function to get or create a notes index for a user
async function getOrCreateNotesIndex(userId: string = DEFAULT_USER_ID) {
  await connectDB();
  
  // Validate userId format before creating ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error(`Invalid userId format: ${userId}. Must be a 24 character hex string.`);
  }
  
  // Ensure userId is in the correct format
  const objectId = new mongoose.Types.ObjectId(userId);
  
  // Find existing index or create a new one
  let notesIndex = await NotesIndex.findOne({ userId: objectId });
  
  if (!notesIndex) {
    notesIndex = new NotesIndex({
      userId: objectId,
      fields: new Map(),
    });
    await notesIndex.save();
  }
  
  return notesIndex;
}

const functions: ToolFunction[] = [
  {
    type: "function",
    function: {
      name: "addNotesIndexField",
      description: "Add a field to the user's notes index (field name and value are important for later retrieval)",
      parameters: {
        type: "object",
        properties: {
          fieldName: {
            type: "string",
            description: "Name of the field to add (e.g., 'note_title', 'category', etc.)",
          },
          fieldValue: {
            type: "string",
            description: "Value to assign to the field",
          },
          userId: {
            type: "string",
            description: "Optional: ID of the user whose notes index to modify. Uses default if not provided.",
          },
        },
        required: ["fieldName", "fieldValue"],
      },
    },
    execute: async ({ fieldName, fieldValue, userId = DEFAULT_USER_ID }: 
      { fieldName: string; fieldValue: string; userId?: string }) => {
      try {
        const notesIndex = await getOrCreateNotesIndex(userId);
        
        // Add or update the field
        notesIndex.fields.set(fieldName, fieldValue);
        await notesIndex.save();
        
        return {
          success: true,
          message: `Field '${fieldName}' added to notes index successfully`,
          fieldName,
          fieldValue,
        };
      } catch (error) {
        console.error("Error adding field to notes index:", error);
        throw new Error(`Failed to add field: ${error.message}`);
      }
    },
  },
  {
    type: "function",
    function: {
      name: "getNotesIndexFields",
      description: "Get all fields from the user's notes index or a specific field if fieldName is provided",
      parameters: {
        type: "object",
        properties: {
          fieldName: {
            type: "string",
            description: "Optional name of a specific field to retrieve. If not provided, all fields will be returned.",
          },
          userId: {
            type: "string",
            description: "Optional: ID of the user whose notes index to view. Uses default if not provided.",
          },
        },
        required: [],
      },
    },
    execute: async ({ fieldName, userId = DEFAULT_USER_ID }: 
      { fieldName?: string; userId?: string }) => {
      try {
        await connectDB();
        
        // Validate userId format before creating ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          throw new Error(`Invalid userId format: ${userId}. Must be a 24 character hex string.`);
        }
        
        const objectId = new mongoose.Types.ObjectId(userId);
        
        const notesIndex = await NotesIndex.findOne({ userId: objectId });
        
        if (!notesIndex) {
          return {
            success: false,
            message: "No notes index found for this user",
            fields: {},
          };
        }
        
        // Convert the Map to a regular object for easier consumption
        const fieldsObject = Object.fromEntries(notesIndex.fields);
        
        if (fieldName) {
          // Return just the requested field
          const value = notesIndex.fields.get(fieldName);
          
          if (value === undefined) {
            return {
              success: false,
              message: `Field '${fieldName}' not found in notes index`,
              field: null,
            };
          }
          
          return {
            success: true,
            message: `Field '${fieldName}' retrieved successfully`,
            field: {
              name: fieldName,
              value: value,
            },
          };
        }
        
        // Return all fields
        return {
          success: true,
          message: "Notes index fields retrieved successfully",
          fields: fieldsObject,
        };
      } catch (error) {
        console.error("Error retrieving notes index fields:", error);
        throw new Error(`Failed to retrieve fields: ${error.message}`);
      }
    },
  },
  {
    type: "function",
    function: {
      name: "addNoteToIndex",
      description: "Simplified method to add a note title to the user's notes index",
      parameters: {
        type: "object",
        properties: {
          noteTitle: {
            type: "string",
            description: "Title of the note to add to the index",
          },
          userId: {
            type: "string",
            description: "Optional: ID of the user. Uses default if not provided.",
          },
        },
        required: ["noteTitle"],
      },
    },
    execute: async ({ noteTitle, userId = DEFAULT_USER_ID }: 
      { noteTitle: string; userId?: string }) => {
      try {
        const notesIndex = await getOrCreateNotesIndex(userId);
        
        // Generate a unique field name using timestamp
        const fieldName = `note_${Date.now()}`;
        
        // Add the note title to the index
        notesIndex.fields.set(fieldName, noteTitle);
        await notesIndex.save();
        
        return {
          success: true,
          message: `Note '${noteTitle}' added to index successfully`,
          noteTitle,
        };
      } catch (error) {
        console.error("Error adding note to index:", error);
        throw new Error(`Failed to add note to index: ${error.message}`);
      }
    },
  },
  {
    type: "function",
    function: {
      name: "getAllNotes",
      description: "Get all notes from the user's index",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "Optional: ID of the user. Uses default if not provided.",
          },
        },
        required: [],
      },
    },
    execute: async ({ userId = DEFAULT_USER_ID }: { userId?: string }) => {
      try {
        await connectDB();
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          throw new Error(`Invalid userId format: ${userId}. Must be a 24 character hex string.`);
        }
        
        const objectId = new mongoose.Types.ObjectId(userId);
        const notesIndex = await NotesIndex.findOne({ userId: objectId });
        
        if (!notesIndex) {
          return {
            success: false,
            message: "No notes found for this user",
            notes: [],
          };
        }
        
        // Extract all note titles from the fields Map
        const notes = Array.from(notesIndex.fields.values());
        
        return {
          success: true,
          message: `Found ${notes.length} notes`,
          notes,
        };
      } catch (error) {
        console.error("Error retrieving notes:", error);
        throw new Error(`Failed to retrieve notes: ${error.message}`);
      }
    },
  },
];

export default functions;