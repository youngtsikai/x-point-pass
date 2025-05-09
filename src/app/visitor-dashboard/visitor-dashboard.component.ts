import { Component, OnInit, inject, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from '@angular/fire/firestore';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-visitor-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    VisitorHeaderComponent,
    VisitorSidebarComponent,
  ],
  templateUrl: './visitor-dashboard.component.html',
  styleUrl: './visitor-dashboard.component.css',
})
export class VisitorDashboardComponent implements OnInit {
  authserv = inject(AuthService);
  fire = inject(Firestore);
  ActiveVisitsCount: number = 0;
  DisacknowledgedVACount: number = 0;
  RaisedFlagsCount: number = 0;

  private userDependentDataEffect = effect(() => {
    console.log('User signal changed, triggering user-dependent fetches...');
    const currentUser = this.authserv.user();

    if (currentUser && currentUser.displayName) {
      console.log(
        'User is signed in with displayName, fetching user-dependent data.'
      );
      this.fetchActiveVisitsCount(currentUser.displayName);
      this.fetchDisacknowledgedVisitsAck(currentUser.displayName);
      this.fetchRaisedFlagsCount(currentUser.displayName);
    } else {
      console.log(
        'No signed-in user or displayName. Resetting user-dependent counts'
      );
      this.ActiveVisitsCount = 0;
      this.DisacknowledgedVACount = 0;
      this.RaisedFlagsCount = 0;
    }
  });

  constructor() {
    console.log('StaffDashboardComponent initialized');
    this.getCurrentUser();
  }

  ngOnInit() {
    console.log('ngOnit called');
  }

  getCurrentUser() {
    const currentUser = this.authserv.user();
    if (currentUser) {
      console.log('User UID:', currentUser.uid);
      console.log('User Display Name:', currentUser.displayName);
    } else {
      console.log('No user is signed in!!!');
    }
  }

  async fetchDisacknowledgedVisitsAck(hostDisplayName: string) {
    console.log(
      'fetchDisacknowledgedVisitsAck started for host:',
      hostDisplayName
    );
    const visitsCollection = collection(this.fire, 'visitor-preregistrations');

    const pva = query(
      visitsCollection,
      where('name', '==', hostDisplayName),
      where('status', '==', 'disacknowledged')
    );

    try {
      console.log('Executing query for Disacknowledged visits  count...');

      const querySnapshot = await getDocs(pva);
      this.DisacknowledgedVACount = querySnapshot.size;
      console.log(
        'Disacknowledged visits  count query successful. Count:',
        this.DisacknowledgedVACount
      );
    } catch (error) {
      console.error('Error fetching Disacknowledged visits  count:', error);
      this.DisacknowledgedVACount = 0;
      console.log('Disacknowledged visits  count set to 0 due to error');
    }
    console.log('fetchDisacknowledgedVisitAck finished');
  }

  async fetchRaisedFlagsCount(hostDisplayName: string) {
    console.log('RaisedFlagsCount started for host:', hostDisplayName);
    const flagsCollection = collection(this.fire, 'Flags');

    const f = query(
      flagsCollection,
      where('status', '==', 'pending'),
      where('reportedBy', '==', hostDisplayName)
    );

    try {
      console.log('Executing Firestore query for pending raised flags...');
      const querySnapshot = await getDocs(f);
      this.RaisedFlagsCount = querySnapshot.size;
      console.log(
        'Pending raised flags query successful. Count:',
        this.RaisedFlagsCount
      );
    } catch (error) {
      console.error('Error fetching pending raised flags count:', error);
      this.RaisedFlagsCount = 0;
      console.log('Pending  raised flags count set to 0 due to error');
    }
    console.log('fetchRaisedFlagsCount finished');
  }

  async fetchActiveVisitsCount(hostDisplayName: string) {
    console.log('fetchActiveVisitsCount started for host:', hostDisplayName);
    const visitsCollection = collection(this.fire, 'visitor-preregistrations');

    const v = query(
      visitsCollection,
      where('status', '==', 'active'),
      where('name', '==', hostDisplayName)
    );

    try {
      console.log('Executing query for Active visits count...');

      const querySnapshot = await getDocs(v);
      this.ActiveVisitsCount = querySnapshot.size;
      console.log(
        'Active visits count query successful. Count:',
        this.ActiveVisitsCount
      );
    } catch (error) {
      console.error('Error fetching active visits count:', error);
      this.ActiveVisitsCount = 0;
      console.log('Active visits count set to 0 due to error');
    }
    console.log('fetchActiveVisitsCount finished');
  }
}
