import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  role: 'Manufacturer' | 'Supplier' | 'Distributor' | null;
  isAdmin: boolean;
  walletAddress?: string;
  walletConnected: boolean;
  blockchainRegistered: boolean;
  entityName?: string;
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
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
