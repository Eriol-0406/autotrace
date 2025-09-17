import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  userId: mongoose.Types.ObjectId;
  id: string;
  name: string;
  category: string;
  onboardingDate: string;
  contactEmail: string;
  phone?: string;
  address?: string;
  relationshipType: 'vendor' | 'customer';
  roles: string[];
  rating: number;
  fulfillmentRate: number;
  walletAddress: string;
  suppliedParts?: mongoose.Types.ObjectId[];
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
  category: {
    type: String,
    required: true,
  },
  onboardingDate: {
    type: String,
    required: true,
  },
  contactEmail: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: false,
    default: '',
  },
  address: {
    type: String,
    required: false,
    default: '',
  },
  relationshipType: {
    type: String,
    enum: ['vendor', 'customer'],
    required: true,
  },
  roles: {
    type: [String],
    required: true,
    default: [],
  },
  rating: {
    type: Number,
    required: true,
    default: 5,
    min: 1,
    max: 5,
  },
  fulfillmentRate: {
    type: Number,
    required: true,
    default: 100,
    min: 0,
    max: 100,
  },
  walletAddress: {
    type: String,
    required: true,
  },
  suppliedParts: {
    type: [Schema.Types.ObjectId],
    ref: 'Part',
    required: false,
    default: [],
  },
}, {
  timestamps: true,
});

export default mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);
