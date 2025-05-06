import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';

interface Visit {
  id: string;
  name: string;
  phone: string;
  idnum: string;
  licenseplate: string;
  purpose: string;
  host: string;
  visitDate: string;
  visitTime: string;
  status: string;
  visitorUid: string;
}

@Component({
  selector: 'app-visits',
  imports: [
    VisitorHeaderComponent,
    VisitorSidebarComponent,
    CommonModule,
    FormsModule,
    DatePipe,
  ],
  templateUrl: './visits.component.html',
  styleUrl: './visits.component.css',
})
export class VisitsComponent implements OnInit {
  isVisibleActive = true;
  isVisibleInactive = false;
  activeVisits: Visit[] = [];
  inactiveVisits: Visit[] = [];
  db: Firestore = inject(Firestore);
  auth: Auth = inject(Auth);
  loading: boolean = true;

  ngOnInit() {
    this.fetchVisits();
  }

  async fetchVisits() {
    this.loading = true;
    const user = this.auth.currentUser;
    if (user) {
      const visitsQuery = query(
        collection(this.db, 'visitor-preregistrations'),
        where('visitorUid', '==', user.uid)
      );
      try {
        const querySnapshot = await getDocs(visitsQuery);
        this.activeVisits = [];
        this.inactiveVisits = [];
        querySnapshot.forEach((doc) => {
          const visitData = doc.data() as Visit;
          const visit: Visit = { ...visitData, id: doc.id };
          if (visit.status === 'active') {
            this.activeVisits.push(visit);
          } else {
            this.inactiveVisits.push(visit);
          }
        });
      } catch (error) {
        console.error('Error fetching visits:', error);
      } finally {
        this.loading = false;
      }
    } else {
      this.loading = false;
    }
  }

  toggleActive() {
    this.isVisibleActive = true;
    this.isVisibleInactive = false;
  }

  toggleInactive() {
    this.isVisibleActive = false;
    this.isVisibleInactive = true;
  }

  async cancelVisit(visitId: string) {
    console.log('visitId:', visitId);
    try {
      const visitDocRef = doc(this.db, 'visitor-preregistrations', visitId);
      await updateDoc(visitDocRef, { status: 'cancelled' });
      this.fetchVisits();
    } catch (error) {
      console.error('Error cancelling visit:', error);
    }
  }
}
