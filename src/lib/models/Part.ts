import mongoose, { Schema, Document } from 'mongoose';

export interface IPart extends Document {
  userId: mongoose.Types.ObjectId;
  id: string;
  name: string;
  quantity: number;
  reorderPoint: number;
  maxStock: number;
  type: 'raw' | 'wip' | 'finished';
  source?: string;
  leadTime?: number;
  backorders?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PartSchema = new Schema<IPart>({
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
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  reorderPoint: {
    type: Number,
    required: true,
    default: 20,
  },
  maxStock: {
    type: Number,
    required: true,
    default: 100,
  },
  type: {
    type: String,
    enum: ['raw', 'wip', 'finished'],
    required: true,
  },
  source: {
    type: String,
    default: null,
  },
  leadTime: {
    type: Number,
    default: null,
  },
  backorders: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Part || mongoose.model<IPart>('Part', PartSchema);
