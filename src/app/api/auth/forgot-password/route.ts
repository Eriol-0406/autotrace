
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// --- Placeholder/Mock Functions ---
// In a real application, these would interact with your database and email service.

// Mock user database
const users = [
    { email: 'admin@example.com', password: 'hashedpassword', resetToken: null, resetTokenExpire: null },
    { email: 'user@example.com', password: 'hashedpassword', resetToken: null, resetTokenExpire: null },
];

async function findUserByEmail(email: string) {
    // TODO: Replace with your actual database query
    console.log(`Searching for user with email: ${email}`);
    return users.find(u => u.email === email);
}

async function saveUser(user: any) {
    // TODO: Replace with your actual database update logic
    console.log('Saving user with reset token:', user);
    const userIndex = users.findIndex(u => u.email === user.email);
    if (userIndex !== -1) {
        users[userIndex] = user;
    }
    return Promise.resolve();
}

async function sendResetEmail(email: string, resetLink: string) {
    // TODO: Replace with your actual email sending logic (e.g., Nodemailer, SendGrid)
    console.log('--- Sending Password Reset Email ---');
    console.log(`To: ${email}`);
    console.log(`Link: ${resetLink}`);
    console.log('--- Email Sent (Simulated) ---');
    // This function should throw an error if email sending fails.
    return Promise.resolve();
}

// --- API Route Handler ---

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    const user = await findUserByEmail(email);

    // IMPORTANT: For security, always return a generic success message
    // even if the email is not found. This prevents user enumeration.
    if (!user) {
      console.log(`Attempted password reset for non-existent email: ${email}`);
      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    const resetTokenExpire = Date.now() + 3600000; // Token expires in 1 hour

    // Save the token and expiry date to the user record in the database
    user.resetToken = token;
    user.resetTokenExpire = resetTokenExpire;
    await saveUser(user);
    
    // Create the password reset link
    // In production, use your actual website's URL
    const resetLink = `${req.nextUrl.origin}/reset-password?token=${token}`;

    // Send the email
    await sendResetEmail(user.email, resetLink);

    return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
