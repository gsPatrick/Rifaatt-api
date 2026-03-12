const sequelize = require('./src/Config/database');

async function migrate() {
    try {
        console.log('Starting manual migration...');
        
        // Add status column to users table if it doesn't exist
        await sequelize.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
                    ALTER TABLE "users" ADD COLUMN "status" VARCHAR(255) DEFAULT 'ACTIVE';
                END IF;
            END $$;
        `);
        
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
