import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true },
    profile: {
      name: String,
      bio: String,
      avatar: String,
    },
    role: {
      type: String,
      enum: ['user', 'event-coordinator', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model('User', userSchema);
export default User;
