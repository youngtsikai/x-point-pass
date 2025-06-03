import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp, // Import Timestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

// Define your Visit interface to match your Firestore data structure
// (I'm inferring this from your console log, adjust as needed)
export interface Visit {
  id: string; // Document ID
  estimatedHours: string;
  host: string;
  idnum: string;
  licenseplate: string;
  name: string;
  phone: string;
  purpose: string;
  status: 'cancelled' | 'acknowledged' | 'pending' | 'checkedIn' | 'checkedOut'; // Add other statuses you might have
  visitDate: string; // YYYY-MM-DD format based on your data
  visitTime: string; // HH:MM format
  visitorUid: string;
  // Add other fields if they exist in your documents
}

@Injectable({
  providedIn: 'root',
})
export class VisitsService {
  private firestore: Firestore = inject(Firestore);

  constructor() {}

  /**
   * Listens for real-time updates to 'visitor-preregistrations'
   * for a specific host, ordered by visitDate and visitTime.
   * Filters for visits that are NOT 'checkedOut' or 'cancelled'.
   * @param hostDisplayName The displayName of the host to query for.
   * @returns An Observable of an array of Visit objects.
   */
  listenForActiveVisits(hostDisplayName: string): Observable<Visit[]> {
    const visitsCollectionRef = collection(
      this.firestore,
      'visitor-preregistrations'
    );

    // Create a query that filters by host and excludes 'checkedOut' and 'cancelled' statuses
    // Ordering by visitDate and visitTime for consistent sorting
    const q = query(
      visitsCollectionRef,
      where('host', '==', hostDisplayName),
      where('status', 'in', ['pending', 'acknowledged', 'checkedIn']), // Filter for active statuses
      orderBy('visitDate', 'asc'),
      orderBy('visitTime', 'asc')
    );

    return new Observable((observer) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const visits: Visit[] = [];
          querySnapshot.forEach((doc) => {
            // Ensure the doc.id is included in the Visit object
            visits.push({ id: doc.id, ...(doc.data() as Omit<Visit, 'id'>) });
          });
          observer.next(visits);
        },
        (error) => {
          console.error('VisitsService: Error fetching active visits:', error);
          observer.error(error);
        }
      );

      // Return a cleanup function that unsubscribes when the Observable is no longer observed
      return () => unsubscribe();
    });
  }
}
