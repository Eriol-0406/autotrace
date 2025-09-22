import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash?: string;
  role: 'Manufacturer' | 'Supplier' | 'Distributor' | null;
  isAdmin: boolean;
  walletAddress?: string | null;
  walletConnected: boolean;
  blockchainRegistered: boolean;
  entityName?: string | null;
  resetToken?: string;
  resetTokenExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  passwordHash: {
    type: String,
    required: false,
    select: false,
  },
  role: {
    type: String,
    enum: ['Manufacturer', 'Supplier', 'Distributor'],
    required: false,
    default: null,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  walletAddress: {
    type: String,
    default: null,
  },
  walletConnected: {
    type: Boolean,
    default: false,
  },
  blockchainRegistered: {
    type: Boolean,
    default: false,
  },
  entityName: {
    type: String,
    default: null,
  },
  resetToken: {
    type: String,
    default: null,
  },
  resetTokenExpire: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
