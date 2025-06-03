// src/app/blacklist/blacklist.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common'; // For *ngIf, *ngFor
import { Observable } from 'rxjs'; // For reactive programming
import { map } from 'rxjs/operators'; // For transforming data

// Import Firestore specific modules
import {
  Firestore,
  collection,
  query,
  where,
  collectionData,
} from '@angular/fire/firestore';

export interface User {
  id?: string;
  displayName: string;
  email: string;
  role: 'visitor' | 'admin' | 'staff' | 'security';
  isBlacklisted: boolean;
}

@Component({
  selector: 'app-blacklist',
  standalone: true,
  imports: [CommonModule], // No need for HttpClientModule anymore
  templateUrl: './blacklist.component.html',
  styleUrls: ['./blacklist.component.css'],
})
export class BlacklistComponent implements OnInit {
  blacklistedVisitors$!: Observable<User[]>; // Use Observable convention
  isLoading: boolean = true;
  error: string | null = null;
  isMobileView: boolean = false;

  constructor(private firestore: Firestore) {} // Inject Firestore

  ngOnInit(): void {
    this.checkScreenSize(); // Initial check
    this.fetchBlacklistedVisitors();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobileView = window.innerWidth <= 768; // Adjust breakpoint as needed
  }

  fetchBlacklistedVisitors(): void {
    this.isLoading = true;
    this.error = null; // Clear previous errors

    // 1. Get a reference to the 'users' collection
    const usersCollection = collection(this.firestore, 'users');

    // 2. Create a query to filter documents
    const q = query(
      usersCollection,
      where('role', '==', 'visitor'),
      where('isBlacklisted', '==', true)
    );

    this.blacklistedVisitors$ = collectionData(q, { idField: 'id' }).pipe(
      map((data) => {
        this.isLoading = false;

        return data as User[];
      })
    );

    this.blacklistedVisitors$.subscribe({
      next: (users) => {
        // Data has loaded, check if empty or not to hide loading spinner
        this.isLoading = false;
        if (users.length === 0) {
          // Handle no results specifically if needed, otherwise async pipe will show "No records found"
        }
      },
      error: (err) => {
        console.error(
          'Error fetching blacklisted visitors from Firestore:',
          err
        );
        this.error =
          'Failed to load blacklisted users from Firestore. Please check console for details.';
        this.isLoading = false;
      },
    });
  }
}
