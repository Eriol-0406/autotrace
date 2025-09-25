import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { databaseService } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await databaseService.getUserByEmail(email);
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user without role - they'll choose during onboarding
    const newUser = await databaseService.createUser({
      email,
      passwordHash: hashedPassword,
      name,
      role: null, // No role assigned yet - user will choose during onboarding
      isAdmin: false,
      walletAddress: null,
      walletConnected: false,
      blockchainRegistered: false,
      entityName: null
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
        isAdmin: newUser.isAdmin 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data and token (without password)
    const userResponse = {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isAdmin: newUser.isAdmin,
      walletAddress: newUser.walletAddress,
      walletConnected: newUser.walletConnected,
      blockchainRegistered: newUser.blockchainRegistered,
      entityName: newUser.entityName
    };

    return NextResponse.json({
      message: 'User created successfully',
      user: userResponse,
      token
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
