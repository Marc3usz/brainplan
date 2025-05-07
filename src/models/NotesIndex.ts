import mongoose from 'mongoose';

// Define the schema for notes index fields
// This will allow dynamic fields to be added to notes
const notesIndexSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Store fields as key-value pairs
  fields: {
    type: Map,
    of: {
      type: mongoose.Schema.Types.Mixed,
    },
    default: new Map(),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Automatically update the updatedAt field when modified
notesIndexSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create or get the model
const NotesIndex = mongoose.models.NotesIndex || mongoose.model('NotesIndex', notesIndexSchema);

export default NotesIndex;