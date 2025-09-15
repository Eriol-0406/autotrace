import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  id: string;
  partName: string;
  type: 'supply' | 'demand';
  quantity: number;
  date: string;
  from: string;
  to: string;
  role: 'Manufacturer' | 'Supplier' | 'Distributor';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  fromWallet?: string;
  toWallet?: string;
  invoiceNumber?: string;
  blockchainOrderId?: string;
  blockchainTxHash?: string;
  etherscanUrl?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
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
  type: {
    type: String,
    enum: ['supply', 'demand'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
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
  role: {
    type: String,
    enum: ['Manufacturer', 'Supplier', 'Distributor'],
    required: true,
  },
  blockchainOrderId: {
    type: String,
    default: null,
  },
  blockchainTxHash: {
    type: String,
    default: null,
  },
  etherscanUrl: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
  },
  fromWallet: {
    type: String,
    default: null,
  },
  toWallet: {
    type: String,
    default: null,
  },
  invoiceNumber: {
    type: String,
    default: null,
  },
  approvedBy: {
    type: String,
    default: null,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
