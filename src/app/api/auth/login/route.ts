import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { databaseService } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email (include password for authentication)
    const user = await databaseService.getUserByEmail(email, true);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user has a password (some users might not have passwords if they only use wallet auth)
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'No password set for this account. Please use wallet authentication or reset your password.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data and token
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: user.isAdmin,
      walletAddress: user.walletAddress,
      walletConnected: user.walletConnected,
      blockchainRegistered: user.blockchainRegistered,
      entityName: user.entityName
    };

    return NextResponse.json({
      message: 'Login successful',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
