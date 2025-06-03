import { Injectable, inject, signal, effect } from '@angular/core';
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
  onAuthStateChanged,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  getDoc,
  query,
  where,
  getDocs,
  docData,
} from '@angular/fire/firestore';
import {
  Observable,
  from,
  catchError,
  throwError,
  first,
  ReplaySubject,
  Subscription,
  map,
  tap,
  combineLatest,
  of,
} from 'rxjs';
import { filter } from 'rxjs/operators'; // Import filter

// Interface for user data stored in Firestore documents
interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  name?: string;
  role: string;
  phoneNumber?: string;
  isBlacklisted?: boolean;
  accountCreated?: boolean;
  passwordSet?: boolean;
}

// Interface for the combined user data used within the application
export interface FirestoreUser {
  uid: string;
  email: string;
  displayName: string | null;
  name?: string;
  role: string;
  phoneNumber?: string;
  isBlacklisted?: boolean;
  accountCreated?: boolean;
  passwordSet?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  firebaseAuth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);

  user = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  loading = signal<boolean>(false);
  authError = signal<string | null>(null);

  currentUserData = signal<FirestoreUser | null>(null);

  // This ReplaySubject should only emit 'true' when both Auth and Firestore data are truly ready.
  // Initialize with false to indicate not ready.
  private _authAndFirestoreDataLoadedSubject = new ReplaySubject<boolean>(1);
  public authStateReady$ =
    this._authAndFirestoreDataLoadedSubject.asObservable();

  private firestoreUserSubscription: Subscription | null = null;
  private authStateListenerUnsubscribe: () => void;

  constructor() {
    console.log('AuthService initialized');
    // Ensure it emits false initially, so components/guards can wait.
    this._authAndFirestoreDataLoadedSubject.next(false);

    this.authStateListenerUnsubscribe = onAuthStateChanged(
      this.firebaseAuth,
      async (user) => {
        console.log(
          'AuthService: onAuthStateChanged fired. User:',
          user ? user.uid : 'null'
        );

        // Update basic authentication signals immediately
        this.user.set(user);
        this.isAuthenticated.set(!!user);
        this.loading.set(false);
        this.authError.set(null);

        // Clear any previous Firestore user data subscription
        if (this.firestoreUserSubscription) {
          this.firestoreUserSubscription.unsubscribe();
          this.firestoreUserSubscription = null;
          console.log(
            'AuthService: Unsubscribed from previous Firestore user data listener.'
          );
        }
        // Always clear currentUserData and set auth state to not ready if user logs out or changes
        this.currentUserData.set(null);
        console.log('AuthService: Cleared currentUserData signal.');
        // Crucially, set _authAndFirestoreDataLoadedSubject to false as data is no longer stable/known.
        this._authAndFirestoreDataLoadedSubject.next(false);
        console.log(
          'AuthService: _authAndFirestoreDataLoadedSubject.next(false) - Resetting readiness.'
        );

        if (user) {
          const userDocRef = doc(this.firestore, 'users', user.uid);
          console.log(
            'AuthService: Attempting to set up real-time listener for Firestore doc for UID:',
            user.uid
          );

          this.firestoreUserSubscription = docData(userDocRef)
            .pipe(
              map(
                (firestoreDocData) => firestoreDocData as UserData | undefined
              ),
              // Use tap to ensure next(true) is called *after* signal is set
              tap((firestoreData: UserData | undefined) => {
                let combinedUserData: FirestoreUser;

                if (firestoreData) {
                  console.log(
                    'AuthService: Firestore data received from real-time listener for UID:',
                    firestoreData.uid
                  );
                  combinedUserData = {
                    uid: user.uid,
                    email: user.email || firestoreData.email || '',
                    displayName:
                      user.displayName || firestoreData.displayName || null,
                    role: firestoreData.role,
                    phoneNumber: firestoreData.phoneNumber,
                    isBlacklisted: firestoreData.isBlacklisted,
                    accountCreated: firestoreData.accountCreated,
                    passwordSet: firestoreData.passwordSet,
                    name: firestoreData.name,
                  };
                  console.log(
                    'AuthService: Real-time Firestore user data updated/combined for UID:',
                    user.uid,
                    'Role:',
                    combinedUserData.role
                  );
                } else {
                  console.warn(
                    `AuthService: Firestore document for user ${user.uid} not found. Creating basic profile for app use.`
                  );
                  // If Firestore doc not found, assume a default role and allow access temporarily
                  // Or, handle this as an error/redirect to profile setup
                  combinedUserData = {
                    uid: user.uid,
                    email: user.email || '',
                    displayName: user.displayName || null,
                    role: 'user', // Default role if doc not found
                    accountCreated: true, // Assuming this is an initial user
                    isBlacklisted: false,
                    passwordSet: true, // Assuming default setup for this user
                  };
                  // Optionally, set the document if it doesn't exist
                  setDoc(userDocRef, combinedUserData, { merge: true }).catch(
                    (e) => console.error('Error creating default user doc:', e)
                  );
                }
                this.currentUserData.set(combinedUserData); // Update the signal
                console.log(
                  'AuthService: currentUserData signal SET with UID:',
                  this.currentUserData()?.uid,
                  'Role:',
                  this.currentUserData()?.role
                );

                // Now that both auth state and Firestore data are loaded and signal is set, emit true
                this._authAndFirestoreDataLoadedSubject.next(true); // Emit true
                console.log(
                  'AuthService: _authAndFirestoreDataLoadedSubject.next(true) - Auth state and Firestore data are stable.'
                );
              }),
              catchError((error) => {
                console.error(
                  'AuthService: Error listening to Firestore user data:',
                  error
                );
                this.currentUserData.set(null); // Clear user data on error
                // Signal ready even on error, so the app doesn't hang, but handle the error downstream
                this._authAndFirestoreDataLoadedSubject.next(true);
                return throwError(() => error);
              })
            )
            .subscribe(); // Subscribe to activate the tap/catchError
        } else {
          // If no user is logged in
          this.currentUserData.set(null);
          console.log(
            'AuthService: No user logged in, clearing currentUserData.'
          );
          // Signal that auth state is ready (and null) immediately
          this._authAndFirestoreDataLoadedSubject.next(true); // Emit true
          console.log(
            'AuthService: _authAndFirestoreDataLoadedSubject.next(true) - Auth state is stable (no user).'
          );
        }
      }
    );

    effect(() => {
      const userData = this.currentUserData();
      if (userData) {
        console.log('AuthService: Current User Data (from Signal):', {
          uid: userData.uid,
          displayName: userData.displayName,
          email: userData.email,
          role: userData.role,
        });
      } else {
        console.log(
          'AuthService: No user data available (user signed out or not fetched yet).'
        );
      }
    });
  }

  // Ensure to unsubscribe on destroy to prevent memory leaks if service is destroyed
  ngOnDestroy() {
    if (this.firestoreUserSubscription) {
      this.firestoreUserSubscription.unsubscribe();
    }
    if (this.authStateListenerUnsubscribe) {
      this.authStateListenerUnsubscribe();
    }
  }

  /**
   * Retrieves the current user's combined profile data.
   * This method waits until the initial authentication state and Firestore user data are loaded.
   */
  async getCurrentUser(): Promise<FirestoreUser | null> {
    console.log(
      'AuthService: getCurrentUser() called. Waiting for authAndFirestoreDataLoaded...'
    );
    // Wait for the _authAndFirestoreDataLoadedSubject to emit 'true'.
    // Use filter(ready => ready) to only proceed when it's truly ready.
    await this._authAndFirestoreDataLoadedSubject
      .pipe(
        filter((ready) => ready), // Only proceed if true is emitted
        first()
      )
      .toPromise();
    console.log(
      'AuthService: authAndFirestoreDataLoaded confirmed. Proceeding with getCurrentUser().'
    );

    const cachedData = this.currentUserData();
    if (cachedData) {
      console.log('AuthService: Returning cached currentUserData.');
      return cachedData;
    }
    // If we reach here, it means authStateReady$ emitted true, but currentUserData is null.
    // This implies a logged-out state or an error that cleared currentUserData.
    console.log(
      'AuthService: getCurrentUser() - No Firebase user or data currently signed in or data cleared due to error.'
    );
    return null;
  }

  // ... (rest of your AuthService methods remain the same) ...

  async getUsersForRoles(roles: string[]): Promise<FirestoreUser[]> {
    if (roles.length === 0) {
      return [];
    }
    const usersCollectionRef = collection(this.firestore, 'users');
    const q = query(usersCollectionRef, where('role', 'in', roles));
    const querySnapshot = await getDocs(q);
    // Map Firestore document data to FirestoreUser, ensuring displayName is string | null
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data() as UserData;
      return {
        ...data,
        displayName: data.displayName || null, // Ensure displayName is string | null
      } as FirestoreUser;
    });
  }

  /**
   * Registers a new user with email and password, updates their profile with a display name,
   * and creates/stores their custom data in Firestore.
   */
  signup(
    email: string,
    username: string, // This will be used as the displayName
    password: string,
    role: string,
    phoneNumber?: string
  ): Promise<UserCredential> {
    this.loading.set(true);
    this.authError.set(null);
    return createUserWithEmailAndPassword(this.firebaseAuth, email, password)
      .then((userCredential) => {
        // Update Firebase Auth user profile with the display name
        return updateProfile(userCredential.user, {
          displayName: username,
        }).then(() => {
          const usersCollection = collection(this.firestore, 'users');
          const newUserDoc = doc(usersCollection, userCredential.user.uid);

          // Prepare user data to be stored in Firestore (UserData interface)
          const userDataToStore: UserData = {
            uid: userCredential.user.uid,
            email: email,
            displayName: username,
            role: role,
            phoneNumber: phoneNumber,
            accountCreated: true,
            isBlacklisted: false,
            passwordSet: true, // Assuming password is set immediately on signup
          };

          // Save the user\'s custom data to Firestore
          return setDoc(newUserDoc, userDataToStore).then(() => {
            // Update the currentUserData signal immediately with the newly created data.
            this.currentUserData.set({
              uid: userCredential.user.uid,
              email: userCredential.user.email || email,
              displayName: username || null,
              role: role,
              phoneNumber: phoneNumber,
              accountCreated: true,
              isBlacklisted: false,
              passwordSet: true,
            });
            console.log(
              'AuthService: Signup successful. currentUserData updated.'
            );
            this.loading.set(false);
            return userCredential;
          });
        });
      })
      .catch((error) => {
        this.loading.set(false);
        this.authError.set(error.message);
        console.error('AuthService: Signup error:', error);
        return Promise.reject(error);
      });
  }

  /**
   * Creates a temporary user document in Firestore without creating a Firebase Auth user initially.
   * This is useful for pre-registering users who will set their password later.
   * Returns the ID of the newly created Firestore document.
   */
  async createTempUser(
    email: string,
    name: string, // Corresponds to displayName in Firestore doc
    role: string,
    phoneNumber: string
  ): Promise<string> {
    this.loading.set(true);
    this.authError.set(null);
    try {
      const usersCollection = collection(this.firestore, 'users');
      // Use addDoc to create a document with an auto-generated ID
      const newUserDocRef = await addDoc(usersCollection, {
        email: email,
        displayName: name,
        role: role,
        phoneNumber: phoneNumber,
        passwordSet: false,
        isBlacklisted: false,
      });
      this.loading.set(false);
      console.log(
        'AuthService: Temporary user created with ID:',
        newUserDocRef.id
      );
      return newUserDocRef.id;
    } catch (error: any) {
      this.loading.set(false);
      this.authError.set(error.message);
      console.error('AuthService: createTempUser error:', error);
      throw error;
    }
  }

  /**
   * Sets or updates the password for the currently authenticated user.
   */
  setNewUserPassword(password: string): Promise<void> {
    this.loading.set(true);
    this.authError.set(null);
    const currentUser = this.firebaseAuth.currentUser;

    if (!currentUser) {
      this.loading.set(false);
      this.authError.set('No user currently signed in to update password.');
      console.warn(
        'AuthService: setNewUserPassword failed - No user signed in.'
      );
      return Promise.reject('No user signed in');
    }

    return updatePassword(currentUser, password)
      .then(() => {
        this.loading.set(false);
        console.log('AuthService: User password updated successfully.');
        // Optionally, update a flag in the user\'s Firestore document
        const userDocRef = doc(this.firestore, 'users', currentUser.uid);
        setDoc(userDocRef, { passwordSet: true }, { merge: true }) // Set passwordSet to true
          .catch((e) =>
            console.error('AuthService: Error updating passwordSet flag:', e)
          );
      })
      .catch((error) => {
        this.loading.set(false);
        this.authError.set(error.message);
        console.error('AuthService: setNewUserPassword error:', error);
        return Promise.reject(error);
      });
  }

  /**
   * Authenticates a user with email and password.
   */
  signin(email: string, password: string): Observable<UserCredential | null> {
    this.loading.set(true);
    this.authError.set(null);
    return from(
      signInWithEmailAndPassword(this.firebaseAuth, email, password)
    ).pipe(
      catchError((error) => {
        this.loading.set(false);
        this.authError.set(error.message);
        console.error('AuthService: Signin error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Initiates Facebook login using a popup.
   * Automatically creates/updates a user document in Firestore with a default 'visitor' role.
   */
  facebookLogin(): Promise<User | null> {
    this.loading.set(true);
    this.authError.set(null);
    const provider = new FacebookAuthProvider();
    return signInWithPopup(this.firebaseAuth, provider as AuthProvider)
      .then((result) => {
        this.loading.set(false);
        console.log(
          'AuthService: Successfully signed in with Facebook!',
          result?.user?.uid
        );
        if (result.user) {
          const usersCollection = collection(this.firestore, 'users');
          const userDocRef = doc(usersCollection, result.user.uid);
          // Prepare user data for Firestore (UserData interface)
          const userDataForFirestore: UserData = {
            uid: result.user.uid,
            email: result.user.email || 'N/A',
            displayName: result.user.displayName || 'Facebook User',
            role: 'visitor',
            accountCreated: true,
            isBlacklisted: false,
          };
          // Save or merge user data to Firestore
          setDoc(userDocRef, userDataForFirestore, { merge: true })
            .then(() => {
              // Update the currentUserData signal after saving to Firestore.
              // Ensure displayName is `string | null` for the signal\'s type consistency.\
              this.currentUserData.set({
                uid: result.user!.uid,
                email: result.user!.email || 'N/A',
                displayName: result.user!.displayName || null,
                role: 'visitor',
                accountCreated: true,
                isBlacklisted: false,
                passwordSet: true,
              });
              console.log(
                'AuthService: Facebook user data saved/merged to Firestore.'
              );
            })
            .catch((e) =>
              console.error(
                'AuthService: Error saving social login user data to Firestore:',
                e
              )
            );
        }
        return result?.user || null;
      })
      .catch((error: any) => {
        this.loading.set(false);
        this.authError.set(error.message);
        console.error('AuthService: Error signing in with Facebook:', error);
        return null;
      });
  }

  /**
   * Signs out the current user from Firebase Authentication.
   */
  signout(): Observable<void> {
    this.loading.set(true);
    this.authError.set(null);
    return from(signOut(this.firebaseAuth)).pipe(
      catchError((error) => {
        this.loading.set(false);
        this.authError.set(error.message);
        console.error('AuthService: Signout error:', error);
        return throwError(() => error);
      })
    );
  }
}
