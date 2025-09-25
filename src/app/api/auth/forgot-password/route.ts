import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/database';
import crypto from 'crypto';

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
        message: 'If an account with that email exists, we have sent a password reset link.'
      }, { status: 200 });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await databaseService.updateUser(user._id, {
      resetToken,
      resetTokenExpiry: resetTokenExpiry
    });

    // In a real application, you would send an email here
    // For now, we'll just return the token (remove this in production!)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: http://localhost:9002/reset-password?token=${resetToken}`);

    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.',
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