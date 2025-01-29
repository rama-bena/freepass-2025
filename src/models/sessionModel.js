import mongoose from 'mongoose';
import { SessionStatus } from '../utils/types';

const feedbackSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const sessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    time: { type: Date, required: true },
    maximum_participants: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.UPCOMING,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    feedbacks: [feedbackSchema],
  },
  { timestamps: true }
);

const Session = mongoose.model('Session', sessionSchema);
export default Session;
