const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    destination: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    travelMode: {
      type: String,
      required: true,
      enum: ['flight', 'train', 'car', 'bus', 'other'],
    },
    budget: { type: Number, required: true, min: 0 },
    members: { type: Number, required: true, min: 1 },
    preferencesText: { type: String },
    result: { type: Object, required: true },
    model: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Itinerary', itinerarySchema);