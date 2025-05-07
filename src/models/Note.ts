import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to User collection
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a title for the note'],
  },
  content: {
    type: String,
    required: [true, 'Please provide content for the note'],
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

// Automatically update the updatedAt field
noteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Note || mongoose.model('Note', noteSchema);
