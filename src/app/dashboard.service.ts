import { OnInit, inject, Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDoc,
  and,
  Timestamp,
  orderBy,
  limit,
  updateDoc,
  doc,
  FirestoreError,
  onSnapshot,
  or,
  getDocs,
  QuerySnapshot,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import {
  Observable,
  Subscription,
  BehaviorSubject,
  combineLatest,
  of,
  from,
} from 'rxjs'; // Added `from` and `of`
import { map, switchMap, catchError, filter, tap } from 'rxjs/operators'; // Added `filter` and `tap`

interface CheckinRecord {
  checkin_time: Timestamp;
  checkout_time?: Timestamp;
  name: string;
  role: string;
  checkin_status?: boolean;
}

interface ActivityAlert {
  id?: string;
  statusId?: string;
  timestamp: Timestamp;
  time?: string;
  read: boolean;

  name?: string;
  role?: string;

  alertType?: string;
  message?: string;
  sender?: string;
  senderId?: string;
  senderRole?: string;
  senderName?: string;
  code?: string;

  type: 'checkin' | 'checkout' | 'sent-alert';
}

@Injectable({ providedIn: 'root' })
export class DashboardService implements OnInit, OnDestroy {
  private fire = inject(Firestore);
  private authserv = inject(AuthService);

  public staffCheckedInCount$ = new BehaviorSubject<number>(0);
  public visitorCheckedInCount$ = new BehaviorSubject<number>(0);
  public CheckInsTodayCount$ = new BehaviorSubject<number>(0);
  public CheckOutsTodayCount$ = new BehaviorSubject<number>(0);
  public headCount$ = new BehaviorSubject<number>(0);
  public NewFlagCount$ = new BehaviorSubject<number>(0);
  public UnreadAlertsTodayCount$ = new BehaviorSubject<number>(0);
  public PendingVACount$ = new BehaviorSubject<number>(0);
  public ActiveVisitsCount$ = new BehaviorSubject<number>(0);
  public AcknowledgedVisitsCount$ = new BehaviorSubject<number>(0);
  public DisacknowledgedVisitCount$ = new BehaviorSubject<number>(0);
  public MyPendingFlagsCount$ = new BehaviorSubject<number>(0);

  public checkInsYesterdayCount$ = new BehaviorSubject<number>(0);
  public checkInsTodayChange$ = new BehaviorSubject<number>(0);
  public checkInsTodayTrend$ = new BehaviorSubject<'up' | 'down' | 'no-change'>(
    'no-change'
  );
  public checkInsTodayColor$ = new BehaviorSubject<'green' | 'red' | 'gray'>(
    'gray'
  );

  public checkOutsYesterdayCount$ = new BehaviorSubject<number>(0);
  public checkOutsTodayChange$ = new BehaviorSubject<number>(0);
  public checkOutsTodayTrend$ = new BehaviorSubject<
    'up' | 'down' | 'no-change'
  >('no-change');
  public checkOutsTodayColor$ = new BehaviorSubject<'green' | 'red' | 'gray'>(
    'gray'
  );

  public recentActivityAlerts$ = new BehaviorSubject<ActivityAlert[]>([]);

  // Keep the existing subscriptions array, but ensure it's managed correctly
  private subscriptions: Subscription[] = [];
  // A new subscription to manage the authStateReady$ listener
  private authReadySubscription: Subscription | null = null;

  constructor() {
    console.log('Dashboard service initialized');
  }

  ngOnInit() {
    console.log(
      'ngOnInit called in DashboardService. Waiting for auth state readiness.'
    );

    // This is the main change: subscribe to authStateReady$
    this.authReadySubscription = this.authserv.authStateReady$
      .pipe(
        filter((isReady) => isReady), // Only proceed when auth state is ready
        switchMap(() => {
          const currentUser = this.authserv.currentUserData(); // Get the current user data from AuthService
          if (currentUser) {
            console.log(
              'DashboardService: Auth state is ready and user is logged in. Activating data subscriptions.'
            );
            // If a user is logged in, then proceed with all your original subscription calls
            // We'll wrap these in an observable that completes once they are setup.
            // First, clear any previous subscriptions if this is a re-login
            this.cleanupDataSubscriptions(); // Call a new cleanup method
            // Now, set up all your original subscriptions
            this.setupAllDashboardDataSubscriptions();
            return of(true); // Emit a value to complete this inner observable
          } else {
            console.log(
              'DashboardService: Auth state is ready but no user logged in. Clearing dashboard data.'
            );
            this.resetAllDashboardCounts();
            this.cleanupDataSubscriptions(); // Ensure all listeners are stopped
            return of(false); // Emit a value to complete this inner observable
          }
        }),
        catchError((error) => {
          console.error(
            'DashboardService: Error in authStateReady$ stream:',
            error
          );
          this.resetAllDashboardCounts();
          this.cleanupDataSubscriptions();
          return of(null); // Continue gracefully
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    console.log('ngOnDestroy called, unsubscribing from all listeners.');
    if (this.authReadySubscription) {
      this.authReadySubscription.unsubscribe();
    }
    this.cleanupDataSubscriptions(); // Ensure all data-related subscriptions are cleaned up
    this.completeAllBehaviorSubjects();
  }

  // New method to encapsulate your existing subscription calls
  private setupAllDashboardDataSubscriptions(): void {
    console.log(
      'DashboardService: Setting up real-time dashboard data subscriptions.'
    );
    // Your original calls, but now they are only executed when auth is ready
    this.subscribeToCheckedInCounts();
    this.subscribeToCheckinCheckoutCounts();
    this.subscribeToNewFlagsCount();
    this.subscribeToRecentActivityAlerts();
    this.subscribeToPendingVACount();
    this.subscribeToActiveVisitsCount();
    this.subscribeToAcknowledgedVisitsCount();
    this.subscribeToDisacknowledgedVisitsCount();
    this.subscribeToMyPendingFlagsCount();
  }

  // New method to clear existing data subscriptions
  private cleanupDataSubscriptions(): void {
    console.log('DashboardService: Cleaning up existing data subscriptions.');
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = []; // Reset the array
  }

  private resetAllDashboardCounts(): void {
    console.log('DashboardService: Resetting all dashboard counts to 0/empty.');
    this.staffCheckedInCount$.next(0);
    this.visitorCheckedInCount$.next(0);
    this.CheckInsTodayCount$.next(0);
    this.CheckOutsTodayCount$.next(0);
    this.headCount$.next(0);
    this.NewFlagCount$.next(0);
    this.UnreadAlertsTodayCount$.next(0);
    this.PendingVACount$.next(0);
    this.ActiveVisitsCount$.next(0);
    this.AcknowledgedVisitsCount$.next(0);
    this.DisacknowledgedVisitCount$.next(0);
    this.MyPendingFlagsCount$.next(0);
    this.checkInsYesterdayCount$.next(0);
    this.checkInsTodayChange$.next(0);
    this.checkInsTodayTrend$.next('no-change');
    this.checkInsTodayColor$.next('gray');
    this.checkOutsYesterdayCount$.next(0);
    this.checkOutsTodayChange$.next(0);
    this.checkOutsTodayTrend$.next('no-change');
    this.checkOutsTodayColor$.next('gray');
    this.recentActivityAlerts$.next([]);
  }

  private completeAllBehaviorSubjects(): void {
    this.staffCheckedInCount$.complete();
    this.visitorCheckedInCount$.complete();
    this.CheckInsTodayCount$.complete();
    this.CheckOutsTodayCount$.complete();
    this.headCount$.complete();
    this.NewFlagCount$.complete();
    this.UnreadAlertsTodayCount$.complete();
    this.checkInsYesterdayCount$.complete();
    this.checkInsTodayChange$.complete();
    this.checkInsTodayTrend$.complete();
    this.checkInsTodayColor$.complete();
    this.checkOutsYesterdayCount$.complete();
    this.checkOutsTodayChange$.complete();
    this.checkOutsTodayTrend$.complete();
    this.checkOutsTodayColor$.complete();
    this.recentActivityAlerts$.complete();
    this.PendingVACount$.complete();
    this.ActiveVisitsCount$.complete();
    this.AcknowledgedVisitsCount$.complete();
    this.DisacknowledgedVisitCount$.complete();
    this.MyPendingFlagsCount$.complete();
  }

  private getDateRange(dayOffset: number): { start: Date; end: Date } {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return {
      start: Timestamp.fromDate(start).toDate(),
      end: Timestamp.fromDate(end).toDate(),
    };
  }

  private createFirestoreCollectionObservable<T>(
    collectionRef: any,
    queryFn?: (ref: any) => any
  ): Observable<T[]> {
    return new Observable<T[]>((subscriber) => {
      let q = collectionRef;
      if (queryFn) {
        q = queryFn(collectionRef);
      }
      const unsubscribe = onSnapshot(
        q,
        (snapshot: any) => {
          const data = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...(doc.data() as any),
          }));
          subscriber.next(data as T[]);
        },
        (error: any) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    });
  }

  private subscribeToVisitorCheckedInCount() {
    console.log('Subscribing to Checked-In Visitor count');
    const checkinCollection = collection(this.fire, 'checkins');
    const q = query(
      checkinCollection,
      where('role', '==', 'visitor'),
      where('checkin_status', '==', true)
    );

    const sub = new Observable<number>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          subscriber.next(querySnapshot.size);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).subscribe({
      next: (count) => {
        this.visitorCheckedInCount$.next(count);
        this.updateHeadCount();
        console.log('Real-time Checked-in visitor count:', count);
      },
      error: (error) => {
        console.error(
          'Error fetching checked in visitor count (real-time):',
          error
        );
        // Important: Reset relevant BehaviorSubject on error to avoid stale data
        this.visitorCheckedInCount$.next(0);
        this.updateHeadCount(); // Re-calculate head count
      },
    });
    this.subscriptions.push(sub);
  }

  private subscribeToPendingVACount() {
    console.log('Subscribing to fetchPendingVACount');

    // Get current user data from AuthService, which should be reliable here
    const currentUser = this.authserv.currentUserData(); // Use currentUserData signal/method
    const currentUserName = currentUser?.displayName;

    if (!currentUserName) {
      console.warn(
        'subscribeToPendingVACount: No user display name available. Cannot fetch user-specific alerts.'
      );
      this.PendingVACount$.next(0); // Reset count if no user
      return;
    }

    const preregistrationsCollection = collection(
      this.fire,
      'visitor-preregistrations'
    );
    const q = query(
      preregistrationsCollection,
      where('status', '==', 'pending'),
      where('host', '==', currentUserName)
    );

    const sub = new Observable<number>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          subscriber.next(querySnapshot.size);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).subscribe({
      next: (count) => {
        this.PendingVACount$.next(count);
        console.log('Real-time pending visits acknowledgements:', count);
      },
      error: (error) => {
        console.error(
          'Error fetching pending visits acknowledgements (real-time):',
          error
        );
        this.PendingVACount$.next(0); // Reset on error
      },
    });
    this.subscriptions.push(sub);
  }

  private subscribeToStaffCheckedInCount() {
    console.log('Subscribing to fetchCheckedInStaffCount');
    const checkinCollection = collection(this.fire, 'checkins');
    const q = query(
      checkinCollection,
      and(
        where('checkin_status', '==', true),
        or(
          where('role', '==', 'staff'),
          where('role', '==', 'security'),
          where('role', '==', 'admin')
        )
      )
    );

    const sub = new Observable<number>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          subscriber.next(querySnapshot.size);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).subscribe({
      next: (count) => {
        this.staffCheckedInCount$.next(count);
        this.updateHeadCount();
        console.log('Real-time Checked-in staff count:', count);
      },
      error: (error) => {
        console.error(
          'Error fetching checked-in staff count (real-time):',
          error
        );
        this.staffCheckedInCount$.next(0); // Reset on error
        this.updateHeadCount(); // Re-calculate head count
      },
    });
    this.subscriptions.push(sub);
  }

  private subscribeToCheckedInCounts() {
    this.subscribeToStaffCheckedInCount();
    this.subscribeToVisitorCheckedInCount();
  }

  private updateHeadCount() {
    // This method needs to be called within the next: block of the subscriptions
    // to staff and visitor counts. It should not create a new subscription here
    // every time staff or visitor count changes.
    // The previous `combineLatest` here would create a new subscription on every update
    // from staff/visitor count, which is not ideal.
    // Instead, it should just read the current values from the BehaviorSubjects.
    const staffCount = this.staffCheckedInCount$.getValue();
    const visitorCount = this.visitorCheckedInCount$.getValue();
    this.headCount$.next(staffCount + visitorCount);
    console.log('Headcount calculated:', this.headCount$.getValue());
  }

  private subscribeToCheckInsTodayCount() {
    console.log('Subscribing to fetchCheckInsTodayCount');
    const checkinCollection = collection(this.fire, 'checkins');
    const { start, end } = this.getDateRange(0);

    const q = query(
      checkinCollection,
      where('checkin_time', '>=', start),
      where('checkin_time', '<=', end)
    );

    const sub = new Observable<number>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          subscriber.next(querySnapshot.size);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).subscribe({
      next: (count) => {
        this.CheckInsTodayCount$.next(count);
        this.calculateCheckInsTodayChange();
        console.log('Real-time Check-ins today count:', count);
      },
      error: (error) => {
        console.error(
          'Error fetching check-ins today count (real-time):',
          error
        );
        this.CheckInsTodayCount$.next(0); // Reset on error
        this.calculateCheckInsTodayChange();
      },
    });
    this.subscriptions.push(sub);
  }

  private subscribeToCheckOutsTodayCount() {
    console.log('Subscribing to fetchCheckOutsTodayCount');
    const checkinCollection = collection(this.fire, 'checkins');
    const { start, end } = this.getDateRange(0);

    const q = query(
      checkinCollection,
      where('checkout_time', '>=', start),
      where('checkout_time', '<=', end)
    );

    const sub = new Observable<number>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          subscriber.next(querySnapshot.size);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).subscribe({
      next: (count) => {
        this.CheckOutsTodayCount$.next(count);
        this.calculateCheckOutsTodayChange();
        console.log('Real-time Check-outs today count:', count);
      },
      error: (error) => {
        console.error(
          'Error fetching check-outs today count (real-time):',
          error
        );
        this.CheckOutsTodayCount$.next(0); // Reset on error
        this.calculateCheckOutsTodayChange();
      },
    });
    this.subscriptions.push(sub);
  }

  private subscribeToCheckInsYesterdayCount() {
    console.log('Subscribing to fetchCheckInsYesterdayCount');
    const checkinCollection = collection(this.fire, 'checkins');
    const { start, end } = this.getDateRange(-1);
    const q = query(
      checkinCollection,
      where('checkin_time', '>=', start),
      where('checkin_time', '<=', end)
    );
    const sub = new Observable<number>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          subscriber.next(querySnapshot.size);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).subscribe({
      next: (count) => {
        this.checkInsYesterdayCount$.next(count);
        this.calculateCheckInsTodayChange();
        console.log('Real-time Check-ins yesterday count:', count);
      },
      error: (error) => {
        console.error(
          'Error fetching check-ins yesterday count (real-time):',
          error
        );
        this.checkInsYesterdayCount$.next(0); // Reset on error
        this.calculateCheckInsTodayChange();
      },
    });
    this.subscriptions.push(sub);
  }

  private subscribeToCheckOutsYesterdayCount() {
    console.log('Subscribing to fetchCheckOutsYesterdayCount');
    const checkinCollection = collection(this.fire, 'checkins');
    const { start, end } = this.getDateRange(-1);
    const q = query(
      checkinCollection,
      where('checkout_time', '>=', start),
      where('checkout_time', '<=', end)
    );
    const sub = new Observable<number>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          subscriber.next(querySnapshot.size);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).subscribe({
      next: (count) => {
        this.checkOutsYesterdayCount$.next(count);
        this.calculateCheckOutsTodayChange();
        console.log('Real-time Check-outs yesterday count:', count);
      },
      error: (error) => {
        console.error(
          'Error fetching check-outs yesterday count (real-time):',
          error
        );
        this.checkOutsYesterdayCount$.next(0); // Reset on error
        this.calculateCheckOutsTodayChange();
      },
    });
    this.subscriptions.push(sub);
  }

  private subscribeToCheckinCheckoutCounts() {
    this.subscribeToCheckInsTodayCount();
    this.subscribeToCheckOutsTodayCount();
    this.subscribeToCheckInsYesterdayCount();
    this.subscribeToCheckOutsYesterdayCount();
  }

  private subscribeToNewFlagsCount() {
    console.log('Subscribing to fetchNewFlags');
    const flagsCollection = collection(this.fire, 'Flags');
    const q = query(flagsCollection, where('status', '==', 'pending'));
    const sub = new Observable<number>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          subscriber.next(querySnapshot.size);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).subscribe({
      next: (count) => {
        this.NewFlagCount$.next(count);
        console.log('Real-time New Raised Flags count:', count);
      },
      error: (error) => {
        console.error('Error fetching new flags count (real-time):', error);
        this.NewFlagCount$.next(0); // Reset on error
      },
    });
    this.subscriptions.push(sub);
  }

  private subscribeToRecentActivityAlerts() {
    console.log(
      'Subscribing to recent activity alerts (real-time with onSnapshot)'
    );

    // Get current user data from AuthService, which should be reliable here
    const currentUser = this.authserv.currentUserData(); // Use currentUserData signal/method
    const currentUserId = currentUser?.uid;

    if (!currentUserId) {
      console.warn(
        'subscribeToRecentActivityAlerts: No user UID available. Cannot fetch user-specific alerts.'
      );
      this.recentActivityAlerts$.next([]);
      this.UnreadAlertsTodayCount$.next(0);
      return;
    }

    const checkinAlertsCollection = collection(this.fire, 'checkinalerts');
    const checkoutAlertsCollection = collection(this.fire, 'checkoutalerts');
    const sentAlertsCollection = collection(this.fire, 'alerts');
    const userAlertStatusCollection = collection(this.fire, 'userAlertStatus');

    const limitCount = 20;
    const { start, end } = this.getDateRange(0);

    const checkinAlerts$ = new Observable<ActivityAlert[]>((subscriber) => {
      const q = query(
        checkinAlertsCollection,
        where('timestamp', '>=', start),
        where('timestamp', '<=', end),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => {
            const docData = doc.data();
            return {
              id: doc.id,
              ...docData,
              type: 'checkin',
              name: docData['name'],
              role: docData['role'],
              time:
                (docData['timestamp'] as Timestamp)
                  ?.toDate()
                  .toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }) || 'N/A',
              timestamp: docData['timestamp'] as Timestamp,
              read: docData['read'] === true,
            } as ActivityAlert;
          });
          subscriber.next(data);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).pipe(
      catchError((error) => {
        console.error('Error in checkinAlerts$ stream:', error);
        return of([]); // Return empty array on error
      })
    );

    const checkoutAlerts$ = new Observable<ActivityAlert[]>((subscriber) => {
      const q = query(
        checkoutAlertsCollection,
        where('timestamp', '>=', start),
        where('timestamp', '<=', end),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => {
            const docData = doc.data();
            return {
              id: doc.id,
              ...docData,
              type: 'checkout',
              name: docData['name'],
              role: docData['role'],
              time:
                (docData['timestamp'] as Timestamp)
                  ?.toDate()
                  .toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }) || 'N/A',
              timestamp: docData['timestamp'] as Timestamp,
              read: docData['read'] === true,
            } as ActivityAlert;
          });
          subscriber.next(data);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).pipe(
      catchError((error) => {
        console.error('Error in checkoutAlerts$ stream:', error);
        return of([]); // Return empty array on error
      })
    );

    const userSentAlerts$ = new Observable<ActivityAlert[]>((subscriber) => {
      const userSentAlertsQuery = query(
        userAlertStatusCollection,
        where('userId', '==', currentUserId),
        where('isRead', '==', false),
        where('sentTimestamp', '>=', start),
        where('sentTimestamp', '<=', end),
        orderBy('sentTimestamp', 'desc')
      );

      const unsubscribe = onSnapshot(
        userSentAlertsQuery,
        async (statusSnapshot) => {
          const fetchPromises = statusSnapshot.docs.map(async (statusDoc) => {
            const statusData = statusDoc.data();
            const alertId = statusData['alertId'] as string;
            const statusDocId = statusDoc.id;

            if (alertId) {
              try {
                const alertDocRef = doc(sentAlertsCollection, alertId);
                const alertDocSnapshot = await getDoc(alertDocRef); // This is a one-time fetch

                if (alertDocSnapshot.exists()) {
                  const alertData = alertDocSnapshot.data();
                  return {
                    id: alertDocSnapshot.id,
                    statusId: statusDocId,
                    ...alertData,
                    type: 'sent-alert',
                    alertType: alertData['alertType'],
                    message: alertData['message'],
                    sender: alertData['senderName'],
                    senderId: alertData['senderId'],
                    senderName: alertData['senderName'],
                    senderRole: alertData['senderRole'],
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
                  } as ActivityAlert;
                }
              } catch (error) {
                console.error(
                  `Error fetching alert content for ID ${alertId}:`,
                  error
                );
              }
            }
            return null;
          });

          const fetchedAlerts = await Promise.all(fetchPromises);
          subscriber.next(
            fetchedAlerts.filter((alert) => alert !== null) as ActivityAlert[]
          );
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).pipe(
      catchError((error) => {
        console.error('Error in userSentAlerts$ stream:', error);
        return of([]); // Return empty array on error
      })
    );

    const combinedAlertsSubscription = combineLatest([
      checkinAlerts$,
      checkoutAlerts$,
      userSentAlerts$,
    ]).subscribe({
      next: ([checkins, checkouts, sentAlerts]) => {
        const combined = [...checkins, ...checkouts, ...sentAlerts];
        const sortedAlerts = combined
          .sort((a, b) => {
            const timestampA = a.timestamp ? a.timestamp.toDate().getTime() : 0;
            const timestampB = b.timestamp ? b.timestamp.toDate().getTime() : 0;
            return timestampB - timestampA;
          })
          .slice(0, limitCount);

        this.recentActivityAlerts$.next(sortedAlerts);

        const unreadCount = sortedAlerts.filter(
          (alert) => alert.type === 'sent-alert' && alert.read === false
        ).length;
        this.UnreadAlertsTodayCount$.next(unreadCount);

        console.log(
          'Real-time Combined recent activity alerts:',
          this.recentActivityAlerts$.getValue()
        );
        console.log(
          'Real-time Unread Alerts Today Count:',
          this.UnreadAlertsTodayCount$.getValue()
        );
      },
      error: (error) => {
        console.error('Error combining real-time activity alerts:', error);
        this.recentActivityAlerts$.next([]); // Reset on error
        this.UnreadAlertsTodayCount$.next(0); // Reset on error
      },
    });

    this.subscriptions.push(combinedAlertsSubscription);
  }

  async markAlertAsRead(alert: ActivityAlert) {
    console.log('Attempting to mark alert as read:', alert);
    if (!alert.id) {
      console.error('Cannot mark alert as read: missing document ID', alert);
      return;
    }

    try {
      if (alert.type === 'sent-alert') {
        if (!alert.statusId) {
          console.error(
            'Cannot mark sent alert as read: missing userAlertStatus document ID, attempting to find it.'
          );
          // Ensure currentUserData is reliable here as well
          const currentUser = this.authserv.currentUserData(); // Use currentUserData signal/method
          const currentUserId = currentUser?.uid;
          if (!currentUserId) {
            console.error('Cannot mark sent alert as read: no user logged in.');
            return;
          }
          const userAlertStatusCollection = collection(
            this.fire,
            'userAlertStatus'
          );
          const findStatusQuery = query(
            userAlertStatusCollection,
            where('userId', '==', currentUserId),
            where('alertId', '==', alert.id),
            limit(1)
          );
          const statusSnapshot = await getDocs(findStatusQuery);
          if (statusSnapshot.docs.length > 0) {
            const statusDoc = statusSnapshot.docs[0];
            alert.statusId = statusDoc.id;
            console.log(`Found userAlertStatus document: ${alert.statusId}`);
          } else {
            console.error(
              `Could not find userAlertStatus document for alert ${alert.id} and user ${currentUserId}`
            );
            return;
          }
        }
        console.log(
          `Marking sent alert status ${alert.statusId} in userAlertStatus as read.`
        );
        const userAlertStatusDocRef = doc(
          this.fire,
          'userAlertStatus',
          alert.statusId as string
        );
        await updateDoc(userAlertStatusDocRef, { isRead: true });
        console.log('Sent alert status updated successfully.');
      } else {
        let collectionName: string;
        switch (alert.type) {
          case 'checkin':
            collectionName = 'checkinalerts';
            break;
          case 'checkout':
            collectionName = 'checkoutalerts';
            break;
          default:
            console.error(
              'Cannot mark non-sent alert as read: unknown alert type',
              alert.type
            );
            return;
        }
        console.log(
          `Marking ${alert.type} alert ${alert.id} in collection ${collectionName} as read.`
        );
        const originalAlertDocRef = doc(this.fire, collectionName, alert.id);
        await updateDoc(originalAlertDocRef, { read: true });
        console.log(`${alert.type} alert updated successfully.`);
      }

      console.log(
        'Update pushed to Firestore, local list will update via real-time listener.'
      );
    } catch (error: any) {
      console.error(`Error marking alert ${alert.id} as read:`, error);
      if (error instanceof FirestoreError) {
        console.error(`Firestore Error Code: ${error.code}`);
      }
    }
  }

  private calculateChangeAndTrend(
    today: number,
    comparison: number
  ): {
    change: number;
    trend: 'up' | 'down' | 'no-change';
    color: 'green' | 'red' | 'gray';
  } {
    let change = 0;
    let trend: 'up' | 'down' | 'no-change' = 'no-change';
    let color: 'green' | 'red' | 'gray' = 'gray';

    if (comparison === 0) {
      if (today > 0) {
        change = 100;
        trend = 'up';
        color = 'green';
      } else {
        change = 0;
        trend = 'no-change';
        color = 'gray';
      }
    } else {
      change = ((today - comparison) / comparison) * 100;
      if (change > 0) {
        trend = 'up';
        color = 'green';
      } else if (change < 0) {
        trend = 'down';
        color = 'red';
      } else {
        trend = 'no-change';
        color = 'gray';
      }
    }
    return { change: Math.abs(change), trend, color };
  }

  calculateCheckInsTodayChange() {
    const { change, trend, color } = this.calculateChangeAndTrend(
      this.CheckInsTodayCount$.getValue(),
      this.checkInsYesterdayCount$.getValue()
    );
    this.checkInsTodayChange$.next(change);
    this.checkInsTodayTrend$.next(trend);
    this.checkInsTodayColor$.next(color);
    console.log('Calculated Check-ins Today Change:', { change, trend, color });
  }

  calculateCheckOutsTodayChange() {
    const { change, trend, color } = this.calculateChangeAndTrend(
      this.CheckOutsTodayCount$.getValue(),
      this.checkOutsYesterdayCount$.getValue()
    );
    this.checkOutsTodayChange$.next(change);
    this.checkOutsTodayTrend$.next(trend);
    this.checkOutsTodayColor$.next(color);
    console.log('Calculated Check-outs Today Change:', {
      change,
      trend,
      color,
    });
  }

  private subscribeToAcknowledgedVisitsCount() {
    console.log('Subscribing to fetchAcknowledgedVisitsCount');

    // Get current user data from AuthService, which should be reliable here
    const currentUser = this.authserv.currentUserData(); // Use currentUserData signal/method
    const currentUserUid = currentUser?.uid;

    if (!currentUserUid) {
      console.warn(
        'subscribeToAcknowledgedVisitsCount: No user UID available. Cannot fetch user-specific alerts.'
      );
      this.AcknowledgedVisitsCount$.next(0);
      return;
    }

    const preregistrationsCollection = collection(
      this.fire,
      'visitor-preregistrations'
    );
    const q = query(
      preregistrationsCollection,
      where('status', '==', 'acknowledged'),
      where('visitorUid', '==', currentUserUid)
    );

    const sub = new Observable<number>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          subscriber.next(querySnapshot.size);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).subscribe({
      next: (count) => {
        this.AcknowledgedVisitsCount$.next(count);
        console.log('Real-time acknowledgded visits:', count);
      },
      error: (error) => {
        console.error(
          'Error fetching acknowledged visits count (real-time):',
          error
        );
        this.AcknowledgedVisitsCount$.next(0); // Reset on error
      },
    });
    this.subscriptions.push(sub);
  }

  private subscribeToDisacknowledgedVisitsCount() {
    console.log('Subscribing to fetchActiveVisitsCount');

    // Get current user data from AuthService, which should be reliable here
    const currentUser = this.authserv.currentUserData(); // Use currentUserData signal/method
    const currentUserUid = currentUser?.uid;

    if (!currentUserUid) {
      console.warn(
        'subscribeToDisacknowledgedVisitsCount: No user UID available. Cannot fetch user-specific alerts.'
      );
      this.DisacknowledgedVisitCount$.next(0);
      return;
    }

    const preregistrationsCollection = collection(
      this.fire,
      'visitor-preregistrations'
    );
    const q = query(
      preregistrationsCollection,
      where('status', '==', 'disacknowledged'),
      where('visitorUid', '==', currentUserUid)
    );

    const sub = new Observable<number>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          subscriber.next(querySnapshot.size);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).subscribe({
      next: (count) => {
        this.DisacknowledgedVisitCount$.next(count);
        console.log('Real-time disacknowledged visits:', count);
      },
      error: (error) => {
        console.error(
          'Error fetching disacknowledged visits count (real-time):',
          error
        );
        this.DisacknowledgedVisitCount$.next(0); // Reset on error
      },
    });
    this.subscriptions.push(sub);
  }

  private subscribeToMyPendingFlagsCount() {
    console.log('Subscribing to fetchMyPendingFlagsCount');

    // Get current user data from AuthService, which should be reliable here
    const currentUser = this.authserv.currentUserData(); // Use currentUserData signal/method
    const currentUserName = currentUser?.displayName;

    if (!currentUserName) {
      console.warn(
        'subscribeToMyPendingFlagsCount: No user display name available. Cannot fetch user-specific alerts.'
      );
      this.MyPendingFlagsCount$.next(0);
      return;
    }

    const flagsCollection = collection(this.fire, 'Flags');
    const q = query(
      flagsCollection,
      where('status', '==', 'pending'),
      where('reportedBy', '==', currentUserName)
    );

    const sub = new Observable<number>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          subscriber.next(querySnapshot.size);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).subscribe({
      next: (count) => {
        this.MyPendingFlagsCount$.next(count);
        console.log('Real-time pending flags:', count);
      },
      error: (error) => {
        console.error(
          'Error fetching my pending flags count (real-time):',
          error
        );
        this.MyPendingFlagsCount$.next(0); // Reset on error
      },
    });
    this.subscriptions.push(sub);
  }

  private subscribeToActiveVisitsCount() {
    console.log('Subscribing to fetchActiveVisitsCount');

    // Get current user data from AuthService, which should be reliable here
    const currentUser = this.authserv.currentUserData(); // Use currentUserData signal/method
    const currentUserName = currentUser?.displayName;

    if (!currentUserName) {
      console.warn(
        'subscribeToActiveVisitsCount: No user display name available. Cannot fetch user-specific alerts.'
      );
      this.ActiveVisitsCount$.next(0);
      return;
    }

    const preregistrationsCollection = collection(
      this.fire,
      'visitor-preregistrations'
    );
    const q = query(
      preregistrationsCollection,
      where('status', '==', 'acknowledged'),
      where('host', '==', currentUserName)
    );

    const sub = new Observable<number>((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          subscriber.next(querySnapshot.size);
        },
        (error) => {
          subscriber.error(error);
        }
      );
      return unsubscribe;
    }).subscribe({
      next: (count) => {
        this.ActiveVisitsCount$.next(count);
        console.log('Real-time active visits:', count);
      },
      error: (error) => {
        console.error('Error fetching active visits count (real-time):', error);
        this.ActiveVisitsCount$.next(0);
      },
    });
    this.subscriptions.push(sub);
  }
}
