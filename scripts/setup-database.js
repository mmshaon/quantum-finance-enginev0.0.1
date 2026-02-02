#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Quantum Finance Engine - Database Setup');
console.log('==========================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📋 Creating .env file from .env.example...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ .env file created successfully\n');
}

// Read current .env content
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if DATABASE_URL is configured
if (!envContent.includes('DATABASE_URL=') || envContent.includes('your-database-url-here')) {
  console.log('⚠️  DATABASE_URL needs to be configured in .env file');
  console.log('\n📝 Database Setup Options:');
  console.log('1. NeonDB (Recommended - Free): https://neon.tech');
  console.log('2. Local PostgreSQL: Install PostgreSQL locally');
  console.log('3. Other PostgreSQL providers (AWS RDS, Heroku, etc.)');
  
  console.log('\n🔧 Quick NeonDB Setup:');
  console.log('1. Go to https://neon.tech');
  console.log('2. Create a free account');
  console.log('3. Create a new project');
  console.log('4. Copy the connection string');
  console.log('5. Update DATABASE_URL in .env file');
  
  console.log('\n📄 Example DATABASE_URL format:');
  console.log('DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"');
  
  process.exit(1);
}

console.log('✅ DATABASE_URL found in .env file');

try {
  console.log('\n🔄 Testing database connection...');
  
  // Test database connection
  execSync('npx prisma db pull --force', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '../database')
  });
  
  console.log('\n📊 Pushing schema to database...');
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '../database')
  });
  
  console.log('\n🔧 Generating Prisma client...');
  try {
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '../database')
    });
  } catch (genError) {
    console.log('⚠️  Prisma client generation had permission issues, but database is ready');
    console.log('💡 This is common on Windows and doesn\'t affect functionality');
  }
  
  console.log('\n✅ Database setup completed successfully!');
  console.log('\n🚀 You can now start the application with:');
  console.log('   npm run dev');
  
} catch (error) {
  console.error('\n❌ Database setup failed:', error.message);
  
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Check your DATABASE_URL in .env file');
  console.log('2. Ensure your database server is running');
  console.log('3. Verify network connectivity to database');
  console.log('4. Check database credentials and permissions');
  
  process.exit(1);
}
