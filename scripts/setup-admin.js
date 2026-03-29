const Auth = require('../models/Auth');

async function setupAdmin() {
  try {
    // Check if admin already exists
    const existing = await Auth.findByUsername('admin');
    if (existing) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create default admin
    const admin = await Auth.createUser('admin', 'your-secure-password-here', 'admin');
    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Please change the default password immediately after first login');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setupAdmin();