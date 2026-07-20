import { sequelize } from '../backend/models/index.js';

const migrate = async () => {
  try {
    console.log('🔄 Running migrations...');
    await sequelize.sync({ alter: true });
    console.log('✅ Migrations complete');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
