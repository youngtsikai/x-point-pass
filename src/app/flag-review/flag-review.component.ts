import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-flag-review',
  imports: [RouterModule, CommonModule],
  templateUrl: './flag-review.component.html',
  styleUrl: './flag-review.component.css',
})
export class FlagReviewComponent implements OnInit {
  isVisibleHigh = true;
  isVisibleMedium = false;
  isVisibleLow = false;

  highThreatFlags: any[] = [];
  mediumThreatFlags: any[] = [];
  lowThreatFlags: any[] = [];

  constructor(private firestore: Firestore, private auth: Auth) {}

  async ngOnInit() {
    await this.loadFlags();
  }

  async loadFlags() {
    const user = this.auth.currentUser;
    if (user && user.displayName) {
      const reportedByName = user.displayName;

      const flagsCollection = collection(this.firestore, 'Flags');

      // High Threat Flags
      const highQuery = query(
        flagsCollection,
        where('reportedBy', '==', reportedByName),
        where('threat', '==', 'High')
      );
      const highSnapshot = await getDocs(highQuery);
      this.highThreatFlags = highSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      // Medium Threat Flags
      const mediumQuery = query(
        flagsCollection,
        where('reportedBy', '==', reportedByName),
        where('threat', '==', 'Medium')
      );
      const mediumSnapshot = await getDocs(mediumQuery);
      this.mediumThreatFlags = mediumSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      // Low Threat Flags
      const lowQuery = query(
        flagsCollection,
        where('reportedBy', '==', reportedByName),
        where('threat', '==', 'Low')
      );
      const lowSnapshot = await getDocs(lowQuery);
      this.lowThreatFlags = lowSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
    }
  }

  toggleHigh() {
    this.isVisibleHigh = true;
    this.isVisibleMedium = false;
    this.isVisibleLow = false;
  }

  toggleMedium() {
    this.isVisibleMedium = true;
    this.isVisibleHigh = false;
    this.isVisibleLow = false;
  }

  toggleLow() {
    this.isVisibleLow = true;
    this.isVisibleHigh = false;
    this.isVisibleMedium = false;
  }
}
