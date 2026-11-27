const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: ['page_view', 'click', 'custom'],
    index: true,
  },
  pageUrl: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  // Click coordinates and viewport dimensions for heatmap rendering
  clickX: {
    type: Number,
    default: null,
  },
  clickY: {
    type: Number,
    default: null,
  },
  viewportWidth: {
    type: Number,
    default: null,
  },
  viewportHeight: {
    type: Number,
    default: null,
  },
  // Element contextual details
  targetTag: {
    type: String,
    default: null,
  },
  targetId: {
    type: String,
    default: null,
  },
  targetClass: {
    type: String,
    default: null,
  },
  targetText: {
    type: String,
    default: null,
    maxlength: 200,
  },
  // Additional flexible metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  }
}, {
  timestamps: true, // adds createdAt and updatedAt
});

// Compound indexes for optimal query performance
EventSchema.index({ sessionId: 1, timestamp: 1 });
EventSchema.index({ pageUrl: 1, eventType: 1 });
EventSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model('Event', EventSchema);
