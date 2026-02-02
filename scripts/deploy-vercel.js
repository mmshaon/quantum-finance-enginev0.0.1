#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Quantum Finance Engine - Vercel Deployment');
console.log('==========================================\n');

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI found');
} catch (error) {
  console.log('❌ Vercel CLI not found');
  console.log('📦 Installing Vercel CLI...');
  execSync('npm i -g vercel', { stdio: 'inherit' });
}

try {
  console.log('\n🏗️  Building applications...');
  
  // Build the entire project
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n📦 Deploying to Vercel...');
  
  // Deploy frontend
  console.log('🌐 Deploying frontend...');
  execSync('cd apps/web && vercel --prod', { stdio: 'inherit' });
  
  // Deploy API
  console.log('🔧 Deploying API...');
  execSync('cd apps/api && vercel --prod', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment completed successfully!');
  console.log('\n📋 Next Steps:');
  console.log('1. Configure environment variables in Vercel dashboard');
  console.log('2. Set up custom domain (optional)');
  console.log('3. Test the deployed application');
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Ensure you are logged into Vercel: vercel login');
  console.log('2. Check your Vercel account credits');
  console.log('3. Verify environment variables are set');
  console.log('4. Check build logs for specific errors');
  
  process.exit(1);
}
