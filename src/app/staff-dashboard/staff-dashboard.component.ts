import { Component, inject, OnInit, effect } from '@angular/core';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  getDocs,
  collection,
  query,
  where,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-staff-dashboard',
  imports: [
    CommonModule,
    StaffHeaderComponent,
    StaffSidebarComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './staff-dashboard.component.html',
  styleUrl: './staff-dashboard.component.css',
})
export class StaffDashboardComponent implements OnInit {
  authserv = inject(AuthService);
  fire = inject(Firestore);
  ActiveVisitsCount: number = 0;
  PendingVACount: number = 0;
  RaisedFlagsCount: number = 0;

  private userDependentDataEffect = effect(() => {
    console.log('User signal changed, triggering user-dependent fetches...');
    const currentUser = this.authserv.user();

    if (currentUser && currentUser.displayName) {
      console.log(
        'User is signed in with displayName, fetching user-dependent data.'
      );
      this.fetchActiveVisitsCount(currentUser.displayName);
      this.fetchPendingVisitsAck(currentUser.displayName);
      this.fetchRaisedFlagsCount(currentUser.displayName);
    } else {
      console.log(
        'No signed-in user or displayName. Resetting user-dependent counts'
      );
      this.ActiveVisitsCount = 0;
      this.PendingVACount = 0;
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

  async fetchPendingVisitsAck(hostDisplayName: string) {
    console.log('fetchPendingVisitsAck started for host:', hostDisplayName);
    const visitsCollection = collection(this.fire, 'visitor-preregistrations');

    const pva = query(
      visitsCollection,
      where('host', '==', hostDisplayName),
      where('status', '==', 'pending')
    );

    try {
      console.log(
        'Executing query for pending visits acknowledgement count...'
      );

      const querySnapshot = await getDocs(pva);
      this.PendingVACount = querySnapshot.size;
      console.log(
        'Pending visits acknowledgements count query successful. Count:',
        this.PendingVACount
      );
    } catch (error) {
      console.error(
        'Error fetching pending visits acknowledgements count:',
        error
      );
      this.PendingVACount = 0;
      console.log('Pending visits acknowledgement count set to 0 due to error');
    }
    console.log('fetchPendingVisitAck finished');
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
    const visitsCollection = collection(this.fire, 'visitor-preregistration');

    const v = query(visitsCollection, where('host', '==', hostDisplayName));

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
