# MongoDB Admin Commands Guide

## Quick User Management Commands

### List All Users
```bash
npx tsx scripts/mongodb-admin.ts list-users
```

### Create New User
```bash
npx tsx scripts/mongodb-admin.ts create-user --name "John Doe" --email "john@example.com" --password "password123" --role "Supplier"
```

### Update User (Set Role, Admin Status, etc.)
```bash
npx tsx scripts/mongodb-admin.ts update-user supplier@example.com --role "Distributor"
npx tsx scripts/mongodb-admin.ts update-user admin@example.com --isAdmin true
```

### Reset Password
```bash
npx tsx scripts/mongodb-admin.ts reset-password admin@example.com newpassword123
```

### Delete User
```bash
npx tsx scripts/mongodb-admin.ts delete-user testuser@example.com
```

### Get Database Statistics
```bash
npx tsx scripts/mongodb-admin.ts stats
```

### Clean Up Database (Remove Invalid Users)
```bash
npx tsx scripts/mongodb-admin.ts cleanup
```

## Working Test Accounts

### Admin Account
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: Admin (can access all features)

### Client Accounts
- **Email**: `supplier@example.com`
- **Password**: `password123`
- **Role**: Supplier

- **Email**: `distributor@example.com`
- **Password**: `password123`
- **Role**: Distributor

- **Email**: `manufacturer@example.com`
- **Password**: `password123`
- **Role**: Manufacturer

## Quick Setup Commands

### Make User Admin
```bash
npx tsx scripts/mongodb-admin.ts update-user user@example.com --isAdmin true --role null
```

### Set User Role
```bash
npx tsx scripts/mongodb-admin.ts update-user user@example.com --role "Supplier"
```

### Connect Wallet to User
```bash
npx tsx scripts/mongodb-admin.ts update-user user@example.com --wallet "0x1234567890123456789012345678901234567890"
```

### Enable Blockchain Registration
```bash
npx tsx scripts/mongodb-admin.ts update-user user@example.com --blockchainRegistered true
```

## Troubleshooting

### Check if User Exists
```bash
npx tsx scripts/mongodb-admin.ts list-users | grep "user@example.com"
```

### Reset All Passwords to Same Value
```bash
npx tsx scripts/mongodb-admin.ts list-users | grep "Email:" | sed 's/.*Email: //' | while read email; do
  npx tsx scripts/mongodb-admin.ts reset-password "$email" "password123"
done
```

### Make All Users Admins
```bash
npx tsx scripts/mongodb-admin.ts list-users | grep "Email:" | sed 's/.*Email: //' | while read email; do
  npx tsx scripts/mongodb-admin.ts update-user "$email" --isAdmin true
done
```
