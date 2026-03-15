const { Reservation, WhatsAppInstance, sequelize } = require('../src/Models');

async function fixJids() {
    try {
        console.log('--- Starting JID Normalization ---');

        function normalize(jid) {
            if (!jid) return null;
            let clean = jid.toString().trim();
            const number = clean.split('@')[0].replace(/[^0-9]/g, '');
            if (!number) return jid; // Keep as is if no numbers found (maybe a group JID?)
            return `${number}@s.whatsapp.net`;
        }

        // 1. Fix Reservations
        const reservations = await Reservation.findAll();
        console.log(`Checking ${reservations.length} reservations...`);
        let resCount = 0;
        for (const res of reservations) {
            const original = res.buyerPhone;
            const normalized = normalize(original);
            if (original !== normalized) {
                await res.update({ buyerPhone: normalized });
                resCount++;
            }
        }
        console.log(`Updated ${resCount} reservations.`);

        // 2. Fix WhatsAppInstances
        const instances = await WhatsAppInstance.findAll();
        console.log(`Checking ${instances.length} instances...`);
        let instCount = 0;
        for (const inst of instances) {
            const original = inst.owner;
            const normalized = normalize(original);
            if (original !== normalized) {
                await inst.update({ owner: normalized });
                instCount++;
            }
        }
        console.log(`Updated ${instCount} instances.`);

        console.log('--- JID Normalization Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Error during normalization:', error);
        process.exit(1);
    }
}

fixJids();
