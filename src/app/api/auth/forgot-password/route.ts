import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/database';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await databaseService.getUserByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been generated.'
      }, { status: 200 });
    }

    // Generate JWT reset token (expires in 1 hour)
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const resetToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        purpose: 'password-reset'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // In a real application, you would send an email with the JWT token
    // For now, we'll just return the token (remove this in production!)
    console.log(`Password reset JWT token for ${email}: ${resetToken}`);
    console.log(`Reset link: http://localhost:9002/reset-password?token=${resetToken}`);

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been generated.',
      // Remove this in production - only for development
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      resetLink: process.env.NODE_ENV === 'development' ? `http://localhost:9002/reset-password?token=${resetToken}` : undefined
    }, { status: 200 });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}