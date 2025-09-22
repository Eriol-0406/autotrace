#!/usr/bin/env tsx

import { MongoClient } from 'mongodb';
import { program } from 'commander';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/autotrace';

interface User {
  _id: string;
  email: string;
  name: string;
  role?: string | null;
  isAdmin: boolean;
  walletAddress?: string | null;
  walletConnected: boolean;
  blockchainRegistered: boolean;
  passwordHash?: string;
  entityName?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class MongoDBAdmin {
  private client: MongoClient;

  constructor() {
    this.client = new MongoClient(MONGODB_URI);
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.close();
  }

  private getUsersCollection() {
    return this.client.db('autotrace').collection<User>('users');
  }

  async getStats() {
    const collection = this.getUsersCollection();
    const totalUsers = await collection.countDocuments();
    const adminUsers = await collection.countDocuments({ isAdmin: true });
    const usersWithPasswords = await collection.countDocuments({ passwordHash: { $exists: true } });
    const usersWithWallets = await collection.countDocuments({ walletConnected: true });

    console.log('📊 Database Statistics:');
    console.log('=====================');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Admin Users: ${adminUsers}`);
    console.log(`Users with Passwords: ${usersWithPasswords}`);
    console.log(`Users with Wallets: ${usersWithWallets}`);
    console.log('');
  }

  async listUsers() {
    const collection = this.getUsersCollection();
    const users = await collection.find({}).sort({ createdAt: -1 }).toArray();

    console.log('👥 All Users:');
    console.log('=============');
    
    users.forEach((user, index) => {
      const icon = user.isAdmin ? '👑' : '👤';
      const role = user.role || 'Not set';
      const hasPassword = user.passwordHash ? '✅' : '❌';
      const createdDate = user.createdAt ? new Date(user.createdAt).toString() : 'Unknown';
      
      console.log(`${index + 1}. ${icon} ${user.name} (${user.email})`);
      console.log(`   Role: ${role}`);
      console.log(`   Password: ${hasPassword}`);
      console.log(`   Created: ${createdDate}`);
      console.log(`   ID: ${user._id}`);
      console.log('');
    });
  }

  async deleteUser(email: string) {
    const collection = this.getUsersCollection();
    const result = await collection.deleteOne({ email });
    
    if (result.deletedCount > 0) {
      console.log(`✅ User ${email} deleted successfully`);
    } else {
      console.log(`❌ User ${email} not found`);
    }
  }

  async updateUser(email: string, updates: Partial<User>) {
    const collection = this.getUsersCollection();
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    const result = await collection.updateOne(
      { email },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      console.log(`❌ User ${email} not found`);
      return;
    }

    if (result.modifiedCount > 0) {
      console.log(`✅ User ${email} updated successfully`);
      console.log('Updated fields:', Object.keys(updates).join(', '));
    } else {
      console.log(`ℹ️  No changes made to user ${email}`);
    }
  }

  async createUser(userData: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    isAdmin?: boolean;
    walletAddress?: string;
  }) {
    const collection = this.getUsersCollection();
    
    // Check if user already exists
    const existingUser = await collection.findOne({ email: userData.email });
    if (existingUser) {
      console.log(`❌ User with email ${userData.email} already exists`);
      return;
    }

    // Hash password if provided
    let passwordHash;
    if (userData.password) {
      const bcrypt = await import('bcryptjs');
      passwordHash = await bcrypt.hash(userData.password, 12);
    }

    const newUser: Omit<User, '_id'> = {
      email: userData.email,
      name: userData.name,
      role: userData.role || null,
      isAdmin: userData.isAdmin || false,
      walletAddress: userData.walletAddress || null,
      walletConnected: !!userData.walletAddress,
      blockchainRegistered: false,
      passwordHash,
      entityName: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newUser as User);
    console.log(`✅ User ${userData.email} created successfully`);
    console.log(`   ID: ${result.insertedId}`);
  }

  async cleanup() {
    const collection = this.getUsersCollection();
    
    // Remove users without emails or with invalid emails
    const invalidEmailResult = await collection.deleteMany({
      $or: [
        { email: { $exists: false } },
        { email: null },
        { email: '' },
        { email: { $regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, $not: true } }
      ]
    });

    // Remove duplicate users (keep the oldest one)
    const duplicates = await collection.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 }, docs: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    let duplicatesRemoved = 0;
    for (const duplicate of duplicates) {
      const idsToRemove = duplicate.docs.slice(1); // Keep first, remove rest
      await collection.deleteMany({ _id: { $in: idsToRemove } });
      duplicatesRemoved += idsToRemove.length;
    }

    console.log('🧹 Database Cleanup Completed:');
    console.log(`   Removed ${invalidEmailResult.deletedCount} users with invalid emails`);
    console.log(`   Removed ${duplicatesRemoved} duplicate users`);
  }

  async resetAdminPassword(email: string, newPassword: string) {
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    await this.updateUser(email, { passwordHash });
    console.log(`✅ Password reset for ${email}`);
  }
}

// CLI Commands
program
  .name('mongodb-admin')
  .description('MongoDB User Management Tool')
  .version('1.0.0');

program
  .command('stats')
  .description('Get database statistics')
  .action(async () => {
    const admin = new MongoDBAdmin();
    try {
      await admin.connect();
      await admin.getStats();
    } finally {
      await admin.disconnect();
    }
  });

program
  .command('list-users')
  .description('List all users')
  .action(async () => {
    const admin = new MongoDBAdmin();
    try {
      await admin.connect();
      await admin.listUsers();
    } finally {
      await admin.disconnect();
    }
  });

program
  .command('delete-user <email>')
  .description('Delete a user by email')
  .action(async (email: string) => {
    const admin = new MongoDBAdmin();
    try {
      await admin.connect();
      await admin.deleteUser(email);
    } finally {
      await admin.disconnect();
    }
  });

program
  .command('update-user <email>')
  .description('Update user properties')
  .option('--role <role>', 'Set user role (Manufacturer, Distributor, Retailer)')
  .option('--admin', 'Make user admin')
  .option('--password <password>', 'Set user password')
  .option('--wallet <address>', 'Set wallet address')
  .action(async (email: string, options: any) => {
    const admin = new MongoDBAdmin();
    try {
      await admin.connect();
      
      const updates: Partial<User> = {};
      if (options.role) updates.role = options.role;
      if (options.admin) updates.isAdmin = true;
      if (options.wallet) {
        updates.walletAddress = options.wallet;
        updates.walletConnected = true;
      }
      
      if (options.password) {
        const bcrypt = await import('bcryptjs');
        updates.passwordHash = await bcrypt.hash(options.password, 12);
      }
      
      if (Object.keys(updates).length === 0) {
        console.log('❌ No update options provided');
        return;
      }
      
      await admin.updateUser(email, updates);
    } finally {
      await admin.disconnect();
    }
  });

program
  .command('create-user')
  .description('Create a new user')
  .option('--name <name>', 'User name (required)')
  .option('--email <email>', 'User email (required)')
  .option('--password <password>', 'User password')
  .option('--role <role>', 'User role')
  .option('--admin', 'Make user admin')
  .option('--wallet <address>', 'Wallet address')
  .action(async (options: any) => {
    if (!options.name || !options.email) {
      console.log('❌ Name and email are required');
      return;
    }
    
    const admin = new MongoDBAdmin();
    try {
      await admin.connect();
      await admin.createUser(options);
    } finally {
      await admin.disconnect();
    }
  });

program
  .command('cleanup')
  .description('Clean up database (remove invalid/duplicate users)')
  .action(async () => {
    const admin = new MongoDBAdmin();
    try {
      await admin.connect();
      await admin.cleanup();
    } finally {
      await admin.disconnect();
    }
  });

program
  .command('reset-password <email> <password>')
  .description('Reset user password')
  .action(async (email: string, password: string) => {
    const admin = new MongoDBAdmin();
    try {
      await admin.connect();
      await admin.resetAdminPassword(email, password);
    } finally {
      await admin.disconnect();
    }
  });

// Add help command
program
  .command('help')
  .description('Show comprehensive MongoDB admin guide')
  .action(() => {
    console.log('🔧 MongoDB User Management Tool - AutoTrace Admin Console');
    console.log('======================================================');
    console.log('');
    console.log('📋 Quick User Management Commands:');
    console.log('');
    console.log('🔍 List All Users:');
    console.log('  npx tsx scripts/mongodb-admin.ts list-users');
    console.log('');
    console.log('➕ Create New User:');
    console.log('  npx tsx scripts/mongodb-admin.ts create-user --name "John Doe" --email "john@example.com" --password "password123" --role "Supplier"');
    console.log('');
    console.log('✏️  Update User (Set Role, Admin Status, etc.):');
    console.log('  npx tsx scripts/mongodb-admin.ts update-user supplier@example.com --role "Distributor"');
    console.log('  npx tsx scripts/mongodb-admin.ts update-user admin@example.com --isAdmin true');
    console.log('');
    console.log('🔐 Reset Password:');
    console.log('  npx tsx scripts/mongodb-admin.ts reset-password admin@example.com newpassword123');
    console.log('');
    console.log('🗑️  Delete User:');
    console.log('  npx tsx scripts/mongodb-admin.ts delete-user testuser@example.com');
    console.log('');
    console.log('📊 Get Database Statistics:');
    console.log('  npx tsx scripts/mongodb-admin.ts stats');
    console.log('');
    console.log('🧹 Clean Up Database (Remove Invalid Users):');
    console.log('  npx tsx scripts/mongodb-admin.ts cleanup');
    console.log('');
    console.log('👥 Working Test Accounts:');
    console.log('');
    console.log('👑 Admin Account:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
    console.log('  Role: Admin (can access all features)');
    console.log('');
    console.log('👤 Client Accounts:');
    console.log('  Email: supplier@example.com     | Password: password123 | Role: Supplier');
    console.log('  Email: distributor@example.com  | Password: password123 | Role: Distributor');
    console.log('  Email: manufacturer@example.com | Password: password123 | Role: Manufacturer');
    console.log('');
    console.log('⚡ Quick Setup Commands:');
    console.log('');
    console.log('🔧 Make User Admin:');
    console.log('  npx tsx scripts/mongodb-admin.ts update-user user@example.com --isAdmin true --role null');
    console.log('');
    console.log('🏷️  Set User Role:');
    console.log('  npx tsx scripts/mongodb-admin.ts update-user user@example.com --role "Supplier"');
    console.log('');
    console.log('🔗 Connect Wallet to User:');
    console.log('  npx tsx scripts/mongodb-admin.ts update-user user@example.com --wallet "0x1234567890123456789012345678901234567890"');
    console.log('');
    console.log('⛓️  Enable Blockchain Registration:');
    console.log('  npx tsx scripts/mongodb-admin.ts update-user user@example.com --blockchainRegistered true');
    console.log('');
    console.log('🛠️  Troubleshooting:');
    console.log('');
    console.log('🔍 Check if User Exists:');
    console.log('  npx tsx scripts/mongodb-admin.ts list-users | grep "user@example.com"');
    console.log('');
    console.log('🔄 Reset All Passwords to Same Value:');
    console.log('  npx tsx scripts/mongodb-admin.ts list-users | grep "Email:" | sed \'s/.*Email: //\' | while read email; do');
    console.log('    npx tsx scripts/mongodb-admin.ts reset-password "$email" "password123"');
    console.log('  done');
    console.log('');
    console.log('👑 Make All Users Admins:');
    console.log('  npx tsx scripts/mongodb-admin.ts list-users | grep "Email:" | sed \'s/.*Email: //\' | while read email; do');
    console.log('    npx tsx scripts/mongodb-admin.ts update-user "$email" --isAdmin true');
    console.log('  done');
    console.log('');
    console.log('📚 Available Commands:');
    console.log('  stats                              Get database statistics');
    console.log('  list-users                         List all users');
    console.log('  delete-user <email>                Delete a user by email');
    console.log('  update-user [options] <email>      Update user properties');
    console.log('  create-user [options]              Create a new user');
    console.log('  cleanup                            Clean up database (remove invalid/duplicate users)');
    console.log('  reset-password <email> <password>  Reset user password');
    console.log('  help                               Show this comprehensive guide');
    console.log('');
    console.log('💡 Pro Tip: Run this command without arguments to see this help guide anytime!');
    console.log('');
  });

// Show comprehensive help if no command provided
if (process.argv.length <= 2) {
  console.log('🔧 MongoDB User Management Tool - AutoTrace Admin Console');
  console.log('======================================================');
  console.log('');
  console.log('📋 Quick User Management Commands:');
  console.log('');
  console.log('🔍 List All Users:');
  console.log('  npx tsx scripts/mongodb-admin.ts list-users');
  console.log('');
  console.log('➕ Create New User:');
  console.log('  npx tsx scripts/mongodb-admin.ts create-user --name "John Doe" --email "john@example.com" --password "password123" --role "Supplier"');
  console.log('');
  console.log('✏️  Update User (Set Role, Admin Status, etc.):');
  console.log('  npx tsx scripts/mongodb-admin.ts update-user supplier@example.com --role "Distributor"');
  console.log('  npx tsx scripts/mongodb-admin.ts update-user admin@example.com --isAdmin true');
  console.log('');
  console.log('🔐 Reset Password:');
  console.log('  npx tsx scripts/mongodb-admin.ts reset-password admin@example.com newpassword123');
  console.log('');
  console.log('🗑️  Delete User:');
  console.log('  npx tsx scripts/mongodb-admin.ts delete-user testuser@example.com');
  console.log('');
  console.log('📊 Get Database Statistics:');
  console.log('  npx tsx scripts/mongodb-admin.ts stats');
  console.log('');
  console.log('🧹 Clean Up Database (Remove Invalid Users):');
  console.log('  npx tsx scripts/mongodb-admin.ts cleanup');
  console.log('');
  console.log('👥 Working Test Accounts:');
  console.log('');
  console.log('👑 Admin Account:');
  console.log('  Email: admin@example.com');
  console.log('  Password: admin123');
  console.log('  Role: Admin (can access all features)');
  console.log('');
  console.log('👤 Client Accounts:');
  console.log('  Email: supplier@example.com     | Password: password123 | Role: Supplier');
  console.log('  Email: distributor@example.com  | Password: password123 | Role: Distributor');
  console.log('  Email: manufacturer@example.com | Password: password123 | Role: Manufacturer');
  console.log('');
  console.log('⚡ Quick Setup Commands:');
  console.log('');
  console.log('🔧 Make User Admin:');
  console.log('  npx tsx scripts/mongodb-admin.ts update-user user@example.com --isAdmin true --role null');
  console.log('');
  console.log('🏷️  Set User Role:');
  console.log('  npx tsx scripts/mongodb-admin.ts update-user user@example.com --role "Supplier"');
  console.log('');
  console.log('🔗 Connect Wallet to User:');
  console.log('  npx tsx scripts/mongodb-admin.ts update-user user@example.com --wallet "0x1234567890123456789012345678901234567890"');
  console.log('');
  console.log('⛓️  Enable Blockchain Registration:');
  console.log('  npx tsx scripts/mongodb-admin.ts update-user user@example.com --blockchainRegistered true');
  console.log('');
  console.log('🛠️  Troubleshooting:');
  console.log('');
  console.log('🔍 Check if User Exists:');
  console.log('  npx tsx scripts/mongodb-admin.ts list-users | grep "user@example.com"');
  console.log('');
  console.log('🔄 Reset All Passwords to Same Value:');
  console.log('  npx tsx scripts/mongodb-admin.ts list-users | grep "Email:" | sed \'s/.*Email: //\' | while read email; do');
  console.log('    npx tsx scripts/mongodb-admin.ts reset-password "$email" "password123"');
  console.log('  done');
  console.log('');
  console.log('👑 Make All Users Admins:');
  console.log('  npx tsx scripts/mongodb-admin.ts list-users | grep "Email:" | sed \'s/.*Email: //\' | while read email; do');
  console.log('    npx tsx scripts/mongodb-admin.ts update-user "$email" --isAdmin true');
  console.log('  done');
  console.log('');
  console.log('📚 Available Commands:');
  console.log('  stats                              Get database statistics');
  console.log('  list-users                         List all users');
  console.log('  delete-user <email>                Delete a user by email');
  console.log('  update-user [options] <email>      Update user properties');
  console.log('  create-user [options]              Create a new user');
  console.log('  cleanup                            Clean up database (remove invalid/duplicate users)');
  console.log('  reset-password <email> <password>  Reset user password');
  console.log('');
  console.log('💡 Pro Tip: Run this command without arguments to see this help guide anytime!');
  console.log('');
  process.exit(0);
}

program.parse();
