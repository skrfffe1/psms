// hooks/useUsers.ts
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config'; // Adjust this path to your Firebase config

export interface UserData {
    id: string;
    email: string;
    displayName: string;
    role: 'admin' | 'staff' | 'user'; // Example roles
    status: 'active' | 'inactive'; // Example status
    phoneNumber?: string; // Optional
    createdAt?: Date; // Convert Timestamp to Date
    // Add other fields you store in your user documents
}

interface UseUsersResult {
    users: UserData[];
    loading: boolean;
    error: string | null;
}

export const useUsers = (): UseUsersResult => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const usersCollectionRef = collection(db, 'users');
        // You can add queries like orderBy, where, etc.
        const q = query(usersCollectionRef, orderBy('displayName', 'asc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const usersList: UserData[] = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                usersList.push({
                    id: doc.id,
                    email: data.email || 'N/A',
                    displayName: data.displayName || 'N/A',
                    role: data.role || 'user',
                    status: data.status || 'active',
                    phoneNumber: data.phoneNumber,
                    createdAt: data.createdAt?.toDate(), // Convert Firestore Timestamp to Date
                    // Map other fields here
                });
            });
            setUsers(usersList);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error("Error fetching users in real-time:", err);
            setError("Failed to load user list.");
            setLoading(false);
        });

        // Clean up the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    return { users, loading, error };
};