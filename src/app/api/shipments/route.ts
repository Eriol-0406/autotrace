import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shipment from '@/lib/models/Shipment';
import IDGenerator from '@/lib/id-generator';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const all = searchParams.get('all');
    
    if (all === 'true') {
      // Admin access - get all shipments from all users, sorted by ID
      const shipments = await Shipment.find({}).sort({ id: 1 });
      return NextResponse.json(shipments);
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const shipments = await Shipment.find({ userId }).sort({ id: 1 });
    return NextResponse.json(shipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Generate proper shipment ID if not provided
    if (!body.id) {
      body.id = IDGenerator.generateShipmentId();
    }
    
    const shipment = new Shipment(body);
    
    await shipment.save();
    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    const shipment = await Shipment.findByIdAndUpdate(_id, updateData, { new: true });
    
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }
    
    return NextResponse.json(shipment);
  } catch (error) {
    console.error('Error updating shipment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
