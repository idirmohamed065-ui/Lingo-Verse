import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({ path: '../backend/.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'lingoverse',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

const setupDatabase = async () => {
  try {
    // Create database if not exists
    const dbName = process.env.DB_NAME || 'lingoverse';
    const tempSequelize = new Sequelize('postgres', process.env.DB_USER || 'postgres', process.env.DB_PASSWORD || 'password', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false
    });

    await tempSequelize.query(`CREATE DATABASE "${dbName}" WITH ENCODING = 'UTF8';`).catch(() => {
      console.log(`Database "${dbName}" already exists or creation failed (may need manual creation)`);
    });
    await tempSequelize.close();

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Enable UUID extension
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('✅ UUID extension enabled.');

    console.log('\n📋 Next steps:');
    console.log('1. Run migrations: npm run db:migrate');
    console.log('2. Seed data: npm run db:seed');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
};

setupDatabase();
