import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  userId: mongoose.Types.ObjectId;
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  relationshipType: 'vendor' | 'customer';
  rating: number;
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: false,
    default: 'N/A',
  },
  email: {
    type: String,
    required: false,
    default: 'N/A',
  },
  phone: {
    type: String,
    required: false,
    default: 'N/A',
  },
  address: {
    type: String,
    required: false,
    default: 'N/A',
  },
  relationshipType: {
    type: String,
    enum: ['vendor', 'customer'],
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    default: 5,
    min: 1,
    max: 5,
  },
  walletAddress: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);
