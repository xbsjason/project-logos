import { useState } from 'react';
import { seedDatabase } from '../../utils/seedData';
import { Database, Check, Loader2 } from 'lucide-react';

export function SeedButton() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSeed = async () => {
        if (!confirm('This will add test users and posts to your database. Continue?')) return;

        setLoading(true);
        try {
            const success = await seedDatabase();
            if (success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                throw new Error("Seeding function returned false");
            }
        } catch (error: any) {
            console.error("Seed error:", error);
            alert(`Seeding failed: ${error.message || 'Unknown error'}. Check console for details.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSeed}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-navy-800 text-gold rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50"
        >
            {loading ? <Loader2 className="animate-spin" size={18} /> : success ? <Check size={18} /> : <Database size={18} />}
            {loading ? 'Seeding...' : success ? 'Done!' : 'Seed Test Data'}
        </button>
    );
}
