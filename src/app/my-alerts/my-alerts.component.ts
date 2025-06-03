import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  doc,
  limit,
  Timestamp,
  getDoc,
  DocumentSnapshot,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from '@angular/fire/firestore';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { combineLatest, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface Alert {
  id?: string;
  statusId?: string;
  alertType: string;
  subject?: string;
  message: string;
  sender?: string;
  senderId?: string;
  senderName?: string;
  senderRole?: string;
  code?: string;
  time?: string;
  timestamp: Timestamp;
  read: boolean;
  deliveryMethod?: 'general' | 'targeted';
  alertCollection?: string;
}

@Component({
  selector: 'app-my-alerts',
  standalone: true,
  imports: [FormsModule, CommonModule, MatSnackBarModule],
  templateUrl: './my-alerts.component.html',
  styleUrl: './my-alerts.component.css',
})
export class MyAlertsComponent implements OnInit, OnDestroy {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);
  private snackBar: MatSnackBar = inject(MatSnackBar);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  allFetchedAlerts: Alert[] = [];
  displayedAlerts: Alert[] = [];

  loading = false;
  error: string | null = null;

  private unsubscribeFunctions: Unsubscribe[] = [];

  ngOnInit(): void {
    this.subscribeToAllUserAlerts();
  }

  ngOnDestroy(): void {
    this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
  }

  private subscribeToAllUserAlerts(): void {
    this.loading = true;
    this.error = null;
    this.allFetchedAlerts = [];
    this.displayedAlerts = [];

    const currentUser = this.authService.user();
    const currentUserId = currentUser?.uid;

    if (!currentUserId) {
      this.error = 'User not logged in.';
      this.snackBar.open(
        'Error: User not logged in. Please log in again.',
        'Close',
        { duration: 5000 }
      );
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    const userAlertStatusCollection = collection(
      this.firestore,
      'userAlertStatus'
    );
    const generalAlertsCollection = collection(this.firestore, 'alerts');

    const userStatusObservable = new Observable<Alert[]>((observer) => {
      const q = query(
        userAlertStatusCollection,
        where('userId', '==', currentUserId)
      );

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const userStatusDocs = snapshot.docs;
          const alertPromises = userStatusDocs.map(async (statusDoc) => {
            const statusData = statusDoc.data();
            const alertId = statusData['alertId'] as string;
            const isRead = statusData['isRead'] as boolean;
            const statusId = statusDoc.id;
            const alertCollectionName = statusData['alertCollection'] as string;

            if (!alertId || !alertCollectionName) return null;
            return await this.fetchAndProcessAlertContent(
              alertId,
              alertCollectionName,
              isRead,
              statusId
            );
          });

          const alertsFromStatus = (await Promise.all(alertPromises)).filter(
            (alert) => alert !== null
          ) as Alert[];
          observer.next(alertsFromStatus);
        },
        (err) => observer.error(err)
      );
      this.unsubscribeFunctions.push(unsubscribe);
    });

    const generalAlertsObservable = new Observable<Alert[]>((observer) => {
      const q = query(
        generalAlertsCollection,
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const generalAlerts = snapshot.docs.map((alertDoc) => {
            const alertData = alertDoc.data();
            return {
              id: alertDoc.id,
              statusId: undefined,
              alertType: alertData['alertType'] || 'General Alert',
              subject: alertData['subject'],
              message: alertData['message'] || 'No message',
              sender: alertData['senderName'] || 'Unknown Sender',
              senderId: alertData['senderId'],
              senderName: alertData['senderName'],
              senderRole: alertData['senderRole'] || 'Unknown Role',
              code: alertData['alertType']?.toLowerCase() || '',
              timestamp: alertData['timestamp'] as Timestamp,
              time:
                (alertData['timestamp'] as Timestamp)
                  ?.toDate()
                  .toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }) || 'N/A',
              read: false,
              deliveryMethod: alertData['deliveryMethod'],
              alertCollection: 'alerts',
            } as Alert;
          });
          observer.next(generalAlerts);
        },
        (err) => observer.error(err)
      );
      this.unsubscribeFunctions.push(unsubscribe);
    });

    combineLatest([userStatusObservable, generalAlertsObservable])
      .pipe(
        map(([alertsFromStatus, generalAlerts]) => {
          const fetchedAlerts: Alert[] = [];
          const alertIdsProcessed = new Set<string>();

          alertsFromStatus.forEach((alert) => {
            fetchedAlerts.push(alert);
            alertIdsProcessed.add(`${alert.id}-${alert.alertCollection}`);
          });

          generalAlerts.forEach((alert) => {
            if (!alertIdsProcessed.has(`${alert.id}-alerts`)) {
              fetchedAlerts.push(alert);
            }
          });

          return fetchedAlerts.sort((a, b) => {
            if (a.read !== b.read) {
              return a.read === false ? -1 : 1;
            }
            const timestampA = a.timestamp?.toDate().getTime() || 0;
            const timestampB = b.timestamp?.toDate().getTime() || 0;
            return timestampB - timestampA;
          });
        }),
        catchError((err) => {
          this.error = `Error combining alerts: ${err.message}`;
          this.snackBar.open(
            `Error processing alerts: ${err.message}`,
            'Close',
            { duration: 5000 }
          );
          this.allFetchedAlerts = [];
          this.displayedAlerts = [];
          return of([]);
        })
      )
      .subscribe({
        next: (sortedAlerts) => {
          this.allFetchedAlerts = sortedAlerts;
          this.displayedAlerts = [...this.allFetchedAlerts];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private async fetchAndProcessAlertContent(
    alertId: string,
    alertCollectionName: string,
    isRead: boolean,
    statusId: string
  ): Promise<Alert | null> {
    const alertCollectionRef = collection(this.firestore, alertCollectionName);
    const alertDocRef = doc(alertCollectionRef, alertId);

    try {
      const alertDocSnapshot: DocumentSnapshot = await getDoc(alertDocRef);

      if (alertDocSnapshot.exists()) {
        const alertData = alertDocSnapshot.data();
        let commonAlert: Alert = {
          id: alertDocSnapshot.id,
          statusId: statusId,
          read: isRead,
          alertCollection: alertCollectionName,
          alertType: 'Unknown',
          message: 'No message provided.',
          sender: 'Unknown Sender',
          senderRole: 'Unknown Role',
          timestamp: Timestamp.now(),
          time: 'N/A',
        };

        switch (alertCollectionName) {
          case 'alerts':
            commonAlert.alertType = alertData?.['alertType'] || 'General Alert';
            commonAlert.subject = alertData?.['subject'];
            commonAlert.message = alertData?.['message'] || 'No message';
            commonAlert.sender = alertData?.['senderName'] || 'Unknown Sender';
            commonAlert.senderId = alertData?.['senderId'];
            commonAlert.senderName = alertData?.['senderName'];
            commonAlert.senderRole =
              alertData?.['senderRole'] || 'Unknown Role';
            commonAlert.timestamp = alertData?.['timestamp'] as Timestamp;
            break;
          case 'flagalerts':
            commonAlert.alertType = alertData?.['alertType'] || 'Flag Alert';
            commonAlert.subject = `Flag Alert: ${
              alertData?.['threatLevel'] || 'Unknown'
            }`;
            commonAlert.message = alertData?.['message'] || 'No flag message.';
            commonAlert.sender =
              alertData?.['reportedBy'] || 'Unknown Reporter';
            commonAlert.senderId = alertData?.['reportedById'];
            commonAlert.senderRole = 'Reporter';
            commonAlert.timestamp = alertData?.['timestamp'] as Timestamp;
            break;
          case 'checkinalerts':
          case 'checkoutalerts':
            const isCheckIn = alertCollectionName === 'checkinalerts';
            const timeField = isCheckIn ? 'checkin_time' : 'checkout_time';
            const type = isCheckIn ? 'Check-in' : 'Check-out';
            const actionVerb = isCheckIn ? 'checked in' : 'checked out';

            commonAlert.alertType = type;
            const name = alertData?.['name'] || 'User';
            commonAlert.subject = `New ${type}: ${name}`;
            const timeValue = alertData?.[timeField];
            let date: Date | null = null;
            if (timeValue instanceof Timestamp) {
              date = timeValue.toDate();
            }

            if (date && !isNaN(date.getTime())) {
              commonAlert.timestamp = Timestamp.fromDate(date);
              const timePart = date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const day = date.getDate();
              const month = date.toLocaleString('default', {
                month: 'short',
              });
              commonAlert.message = `${name} has ${actionVerb} at ${timePart} ${day} ${month}`;
            } else {
              commonAlert.message = `${name} ${actionVerb} (time unavailable).`;
              commonAlert.timestamp = Timestamp.now();
            }

            commonAlert.sender = name || `${type} System`;
            commonAlert.senderId = alertData?.['uid'];
            commonAlert.senderRole = alertData?.['role'] || 'User';
            break;
        }

        if (commonAlert.timestamp) {
          commonAlert.time = commonAlert.timestamp
            .toDate()
            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        commonAlert.code = commonAlert.alertType?.toLowerCase() || '';

        return commonAlert;
      } else {
        return null;
      }
    } catch (alertFetchError: any) {
      console.error(
        `Error fetching alert content for ID ${alertId} from collection ${alertCollectionName}:`,
        alertFetchError
      );
      return null;
    }
  }

  async markAlertAsRead(alertToProcess: Alert): Promise<void> {
    const currentUser = this.authService.user();
    const currentUserId = currentUser?.uid;

    if (!currentUserId) {
      this.snackBar.open('Error: User not logged in.', 'Close', {
        duration: 5000,
      });
      this.cdr.detectChanges();
      return;
    }

    if (!alertToProcess.id || !alertToProcess.alertCollection) {
      this.snackBar.open(
        'Error: Cannot mark alert as read. Missing alert details.',
        'Close',
        { duration: 5000 }
      );
      this.cdr.detectChanges();
      return;
    }

    const userAlertStatusCollection = collection(
      this.firestore,
      'userAlertStatus'
    );
    let userAlertStatusDocRef;

    try {
      if (!alertToProcess.statusId) {
        // Find or create a userAlertStatus entry if it doesn't exist for a general alert
        const findStatusQuery = query(
          userAlertStatusCollection,
          where('userId', '==', currentUserId),
          where('alertId', '==', alertToProcess.id),
          where('alertCollection', '==', alertToProcess.alertCollection),
          limit(1)
        );
        const statusSnapshot = await getDocs(findStatusQuery);

        if (statusSnapshot.docs.length > 0) {
          userAlertStatusDocRef = doc(
            userAlertStatusCollection,
            statusSnapshot.docs[0].id
          );
          alertToProcess.statusId = statusSnapshot.docs[0].id;
        } else {
          const newStatusData = {
            userId: currentUserId,
            alertId: alertToProcess.id,
            alertCollection: alertToProcess.alertCollection,
            isRead: true,
            sentTimestamp: alertToProcess.timestamp || Timestamp.now(),
          };
          userAlertStatusDocRef = doc(userAlertStatusCollection);
          await setDoc(userAlertStatusDocRef, newStatusData);
          alertToProcess.statusId = userAlertStatusDocRef.id;
        }
      } else {
        // Use existing userAlertStatus document
        userAlertStatusDocRef = doc(
          userAlertStatusCollection,
          alertToProcess.statusId
        );
      }

      // Update the userAlertStatus document to mark as read
      await updateDoc(userAlertStatusDocRef, { isRead: true });

      // The real-time listeners will automatically update the UI,
      // so manual updates to `allFetchedAlerts` and `displayedAlerts` are no longer needed here.
    } catch (error: any) {
      this.snackBar.open(
        `Error marking alert as read: ${error.message}`,
        'Close',
        { duration: 5000 }
      );
      this.cdr.detectChanges();
    }
  }

  viewFullAlert(alertToDisplay: Alert): void {
    const title = alertToDisplay.subject || alertToDisplay.alertType;
    const message = alertToDisplay.message;
    if (title && message) {
      alert(
        `Alert from ${
          alertToDisplay.alertCollection || 'Unknown Collection'
        }: ${title}\n\n${message}`
      );
    } else {
      alert('Full alert details not available.');
    }
  }
}
