#!/bin/bash

echo "🚀 Setting up MongoDB for AutoTrace..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed. Please install Homebrew first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

# Install MongoDB
echo "📦 Installing MongoDB..."
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
echo "🔄 Starting MongoDB service..."
brew services start mongodb/brew/mongodb-community

# Wait for MongoDB to start
echo "⏳ Waiting for MongoDB to start..."
sleep 5

# Check if MongoDB is running
if brew services list | grep mongodb-community | grep started > /dev/null; then
    echo "✅ MongoDB is running successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Create a .env.local file in your project root with:"
    echo "   MONGODB_URI=mongodb://localhost:27017/autotrace"
    echo "   NEXTAUTH_SECRET=your-secret-key-here"
    echo "   NEXTAUTH_URL=http://localhost:9002"
    echo ""
    echo "2. Restart your Next.js application:"
    echo "   npm run dev"
    echo ""
    echo "3. Test the connection by logging in - users will be automatically created in the database"
    echo ""
    echo "🔧 Useful MongoDB commands:"
    echo "   mongosh                    # Connect to MongoDB shell"
    echo "   use autotrace              # Switch to your database"
    echo "   show collections          # See all collections"
    echo "   db.users.find()           # See all users"
    echo ""
    echo "🛑 To stop MongoDB:"
    echo "   brew services stop mongodb/brew/mongodb-community"
else
    echo "❌ Failed to start MongoDB. Please check the logs:"
    echo "   brew services list"
    exit 1
fi
