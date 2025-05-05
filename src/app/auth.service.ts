import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  User,
  UserCredential,
  FacebookAuthProvider,
  AuthProvider,
  signInWithPopup,
  updatePassword,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
} from '@angular/fire/firestore';
import { Observable, from, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  firebaseAuth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);
  user = signal<User | null>(this.firebaseAuth.currentUser);
  isAuthenticated = signal<boolean>(!!this.firebaseAuth.currentUser);
  loading = signal<boolean>(false);
  authError = signal<string | null>(null);

  constructor() {
    this.firebaseAuth.onAuthStateChanged((user) => {
      this.user.set(user);
      this.isAuthenticated.set(!!user);
      this.loading.set(false);
      this.authError.set(null);
    });
  }

  // Existing signup function (for full signup)
  signup(
    email: string,
    username: string,
    password: string,
    role: string,
    phoneNumber?: string
  ): Promise<UserCredential> {
    this.loading.set(true);
    this.authError.set(null);
    return createUserWithEmailAndPassword(this.firebaseAuth, email, password)
      .then((userCredential) => {
        return updateProfile(userCredential.user, {
          displayName: username,
        }).then(() => {
          const usersCollection = collection(this.firestore, 'users');
          const newUserDoc = doc(usersCollection, userCredential.user.uid);
          return setDoc(newUserDoc, {
            uid: userCredential.user.uid,
            email: email,
            displayName: username,
            role: role,
            phoneNumber: phoneNumber,
            accountCreated: true, // Indicate that the password has been set
          }).then(() => userCredential);
        });
      })
      .catch((error) => {
        this.loading.set(false);
        this.authError.set(error.message);
        return Promise.reject(error);
      });
  }

  // New function: Create user without password (for initial creation)
  async createTempUser(
    email: string,
    name: string,
    role: string,
    phoneNumber: string
  ): Promise<any> {
    this.loading.set(true);
    this.authError.set(null);
    const usersCollection = collection(this.firestore, 'users');
    const newUserDocRef = await addDoc(usersCollection, {
      email: email,
      name: name,
      role: role,
      phoneNumber: phoneNumber,
      passwordSet: false, // Initially, the password is not set
    });
    this.loading.set(false);
    return newUserDocRef;
  }

  // New Function to set the user's password in Firebase Authentication
  setNewUserPassword(email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.authError.set(null);
    return signInWithEmailAndPassword(this.firebaseAuth, email, password)
      .then((userCredential) => {
        return updatePassword(userCredential.user, password);
      })
      .then(() => {
        this.loading.set(false);
      })
      .catch((error) => {
        this.loading.set(false);
        this.authError.set(error.message);
        return Promise.reject(error);
      });
  }

  signin(email: string, password: string): Observable<UserCredential | null> {
    this.loading.set(true);
    this.authError.set(null);
    return from(
      signInWithEmailAndPassword(this.firebaseAuth, email, password)
    ).pipe(
      catchError((error) => {
        this.loading.set(false);
        this.authError.set(error.message);
        return throwError(() => error);
      })
    );
  }

  facebookLogin(): Promise<User | null> {
    this.loading.set(true);
    this.authError.set(null);
    const provider = new FacebookAuthProvider();
    return signInWithPopup(this.firebaseAuth, provider as AuthProvider)
      .then((result) => {
        this.loading.set(false);
        console.log('Successfully signed in with Facebook!', result?.user);
        return result?.user || null;
      })
      .catch((error: any) => {
        this.loading.set(false);
        this.authError.set(error.message);
        console.error('Error signing in with Facebook:', error);
        return null;
      });
  }

  signout(): Observable<void> {
    this.loading.set(true);
    this.authError.set(null);
    return from(signOut(this.firebaseAuth)).pipe(
      catchError((error) => {
        this.loading.set(false);
        this.authError.set(error.message);
        return throwError(() => error);
      })
    );
  }
}
