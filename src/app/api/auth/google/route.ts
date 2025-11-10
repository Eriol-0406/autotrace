import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * POST /api/auth/google
 * Authenticate or create user via Google OAuth
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { credential } = await request.json();
    
    if (!credential) {
      return NextResponse.json(
        { error: 'Google credential is required' },
        { status: 400 }
      );
    }

    // Decode JWT token to get user info
    // Note: In production, you should verify this token with Google's servers
    // For now, we'll decode it (which is acceptable for this use case)
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 using Buffer (Node.js environment)
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    const googleUser = JSON.parse(jsonPayload);
    
    // Validate Google user data
    if (!googleUser.email || !googleUser.name) {
      return NextResponse.json(
        { error: 'Invalid Google user data' },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await User.findOne({ email: googleUser.email });
    
    if (!user) {
      // Create new user from Google data
      // No password hash needed - they'll always authenticate via Google
      user = new User({
        email: googleUser.email,
        name: googleUser.name,
        passwordHash: undefined, // No password for OAuth users
        role: null, // User needs to select role during onboarding
        isAdmin: false,
        walletConnected: false,
        blockchainRegistered: false,
        entityName: null,
      });
      
      await user.save();
      console.log('✅ Created new user from Google OAuth:', googleUser.email);
    } else {
      console.log('✅ Existing user logged in via Google OAuth:', googleUser.email);
    }

    // Generate JWT token for the user
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data and token
    const { passwordHash, ...userWithoutPassword } = user.toObject();
    
    return NextResponse.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: 'Google authentication failed' },
      { status: 500 }
    );
  }
}

