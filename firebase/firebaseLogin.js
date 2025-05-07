// firebaseLogin.js
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';

export const getUserRole = async () => {
  const user = auth.currentUser;
  const docRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data().role : null;
};
