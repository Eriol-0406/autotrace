import mongoose, { Schema, Document } from 'mongoose';

export interface IHistoryEntry {
  status: string;
  location: string;
  date: string;
}

export interface IShipment extends Document {
  userId: mongoose.Types.ObjectId;
  id: string;
  partName: string;
  quantity: number;
  from: string;
  to: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Delayed';
  role: 'Manufacturer' | 'Supplier' | 'Distributor';
  history: IHistoryEntry[];
  blockchainOrderId?: number | null;
  blockchainTxHash?: string | null;
  etherscanUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const HistoryEntrySchema = new Schema<IHistoryEntry>({
  status: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
}, { _id: false });

const ShipmentSchema = new Schema<IShipment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  partName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Transit', 'Delivered', 'Delayed'],
    required: true,
    default: 'Pending',
  },
  role: {
    type: String,
    enum: ['Manufacturer', 'Supplier', 'Distributor'],
    required: true,
  },
  history: [HistoryEntrySchema],
  blockchainOrderId: { type: Number, default: null },
  blockchainTxHash: { type: String, default: null },
  etherscanUrl: { type: String, default: null },
}, {
  timestamps: true,
});

export default mongoose.models.Shipment || mongoose.model<IShipment>('Shipment', ShipmentSchema);
