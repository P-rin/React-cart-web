import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase-config'

export type UserAddress = {
  street: string
  district: string
  province: string
  postalCode: string
  country: string
}

export type UserProfile = {
  userId: string
  email: string
  username: string
  firstName: string
  lastName: string
  phone: string
  profileImage: string
  role: 'customer' | 'admin'
  status: 'active' | 'suspended' | 'inactive'
  address: UserAddress
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', userId)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as UserProfile
}

export async function updateUserAccount(
  userId: string,
  payload: {
    phone: string
    address: UserAddress
  },
) {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    phone: payload.phone,
    address: payload.address,
    updatedAt: serverTimestamp(),
  })
}
