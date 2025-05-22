// hooks/useSupplyMetrics.ts
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config'; // Make sure this path is correct for your Firebase config

interface SupplyMetrics {
    totalUniqueSupplies: number;
    loading: boolean;
    error: string | null;
    // You could add more metrics here if you expand this hook later
    // totalAvailableStock: number;
    // totalIssuedQuantity: number;
}

export const useSupplyMetrics = (): SupplyMetrics => {
    const [totalUniqueSupplies, setTotalUniqueSupplies] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null); // Clear any previous errors

        const suppliesCollectionRef = collection(db, 'supplies');

        // Set up a real-time listener for the 'supplies' collection
        const unsubscribe = onSnapshot(suppliesCollectionRef, (querySnapshot) => {
            let uniqueSupplyNames = new Set<string>();
            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                // Ensure supplyName is a string and not empty before adding to set
                if (typeof data.supplyName === 'string' && data.supplyName.trim() !== '') {
                    uniqueSupplyNames.add(data.supplyName.trim());
                }
            });
            setTotalUniqueSupplies(uniqueSupplyNames.size);
            setLoading(false);
            setError(null); // Clear error if data loads successfully
        }, (err) => {
            // Error callback for onSnapshot
            console.error("Error fetching unique supply count in real-time:", err);
            setError("Failed to load unique supply count.");
            setLoading(false);
        });

        // Clean up the listener when the component unmounts
        return () => unsubscribe();
    }, []); // Empty dependency array means this effect runs once on mount

    return { totalUniqueSupplies, loading, error };
};