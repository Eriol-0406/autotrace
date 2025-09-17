import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Part from '@/lib/models/Part';
import IDGenerator from '@/lib/id-generator';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const all = searchParams.get('all');
    
    if (all === 'true') {
      // Admin access - get all parts from all users, sorted by ID
      const parts = await Part.find({}).sort({ id: 1 });
      return NextResponse.json(parts);
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const parts = await Part.find({ userId }).sort({ id: 1 });
    return NextResponse.json(parts);
  } catch (error) {
    console.error('Error fetching parts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Generate proper part ID if not provided
    if (!body.id) {
      body.id = IDGenerator.generatePartId();
    }
    
    const part = new Part(body);
    
    await part.save();
    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error('Error creating part:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    const part = await Part.findByIdAndUpdate(_id, updateData, { new: true });
    
    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }
    
    return NextResponse.json(part);
  } catch (error) {
    console.error('Error updating part:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Part ID is required' }, { status: 400 });
    }
    
    await Part.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Part deleted successfully' });
  } catch (error) {
    console.error('Error deleting part:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
