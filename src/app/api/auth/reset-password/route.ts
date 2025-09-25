import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { databaseService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Verify JWT reset token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    let decodedToken;
    
    try {
      decodedToken = jwt.verify(token, JWT_SECRET) as any;
      
      // Check if this is a password reset token
      if (decodedToken.purpose !== 'password-reset') {
        return NextResponse.json(
          { error: 'Invalid token purpose' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Get user from database using the userId from the JWT
    const user = await databaseService.getUserByEmail(decodedToken.email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password (no need to clear reset token since we're using JWT)
    await databaseService.updateUser(user._id, {
      passwordHash: hashedPassword
    });

    return NextResponse.json({
      message: 'Password has been reset successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}