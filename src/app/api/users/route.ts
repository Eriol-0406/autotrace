import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const includePassword = searchParams.get('includePassword') === 'true';
    const all = searchParams.get('all') === 'true';
    
    if (email) {
      const user = await User.findOne({ email }).select(includePassword ? '+passwordHash' : '-passwordHash');
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(user);
    }
    
    // Get all users (for admin user management)
    const users = await User.find({}).select('-passwordHash');
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      email, 
      name, 
      password,
      passwordHash,
      role, 
      isAdmin = false, 
      walletAddress, 
      walletConnected = false,
      blockchainRegistered = false,
      entityName 
    } = body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    // Hash password if provided (optional for OAuth users like Google)
    let hashedPassword = passwordHash;
    if (password && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    // Password is optional for OAuth-authenticated users (e.g., Google)
    // They will always authenticate via OAuth, not password
    const userData: any = {
      email,
      name,
      role,
      isAdmin,
      walletAddress,
      walletConnected,
      blockchainRegistered,
      entityName,
    };
    
    // Only set passwordHash if provided (not required for OAuth users)
    if (hashedPassword) {
      userData.passwordHash = hashedPassword;
    }
    
    const user = new User(userData);
    
    await user.save();
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email, _id, ...updateData } = body;
    
    // Find user by email or _id
    let query = {};
    if (email) {
      query = { email };
    } else if (_id) {
      query = { _id };
    } else {
      return NextResponse.json({ error: 'Email or ID required for update' }, { status: 400 });
    }
    
    const user = await User.findOneAndUpdate(
      query,
      updateData,
      { new: true }
    );
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
