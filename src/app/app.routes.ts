import { Routes } from '@angular/router';
import { MainHeaderComponent } from './main-header/main-header.component';
import { MainHomeComponent } from './main-home/main-home.component';
import { VisitorSigninComponent } from './visitor-signin/visitor-signin.component';
import { VisitorSignupComponent } from './visitor-signup/visitor-signup.component';
import { VisitorDashboardComponent } from './visitor-dashboard/visitor-dashboard.component';
import { StaffHeaderComponent } from './staff-header/staff-header.component';
import { StaffSidebarComponent } from './staff-sidebar/staff-sidebar.component';
import { StaffDashboardComponent } from './staff-dashboard/staff-dashboard.component';
import { VisitorSidebarComponent } from './visitor-sidebar/visitor-sidebar.component';
import { AlertsComponent } from './alerts/alerts.component';
import { AdminSidebarComponent } from './admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from './admin-header/admin-header.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { StaffViewAlertsComponent } from './staff-view-alerts/staff-view-alerts.component';
import { VisitorViewAlertsComponent } from './visitor-view-alerts/visitor-view-alerts.component';
import { SecurityHeaderComponent } from './security-header/security-header.component';
import { SecuritySidebarComponent } from './security-sidebar/security-sidebar.component';
import { SecurityDashboardComponent } from './security-dashboard/security-dashboard.component';
import { StaffCheckInComponent } from './staff-check-in/staff-check-in.component';
import { UsersComponent } from './users/users.component';
import { CheckinLogsComponent } from './checkin-logs/checkin-logs.component';
import { VisitorPreregistratonComponent } from './visitor-preregistraton/visitor-preregistraton.component';
import { VisitsComponent } from './visits/visits.component';
import { FlagComponent } from './flag/flag.component';
import { FlagReviewComponent } from './flag-review/flag-review.component';
import { StaffFlagComponent } from './staff-flag/staff-flag.component';
import { VisitorFlagComponent } from './visitor-flag/visitor-flag.component';
import { AdminFlagComponent } from './admin-flag/admin-flag.component';
import { SecurityFlagsComponent } from './security-flags/security-flags.component';
import { AdminFlagsComponent } from './admin-flags/admin-flags.component';
import { VisitorFlagsComponent } from './visitor-flags/visitor-flags.component';
import { StaffFlagsComponent } from './staff-flags/staff-flags.component';
import { ProfileComponent } from './profile/profile.component';
import { VisitorProfileComponent } from './visitor-profile/visitor-profile.component';
import { StaffProfileComponent } from './staff-profile/staff-profile.component';
import { StaffSignInComponent } from './staff-sign-in/staff-sign-in.component';
import { AdminSigninComponent } from './admin-signin/admin-signin.component';
import { SecuritySigninComponent } from './security-signin/security-signin.component';
import { QrscannerComponent } from './qrscanner/qrscanner.component';
import { CheckedinStaffComponent } from './checkedin-staff/checkedin-staff.component';
import { CheckedinVisitorsComponent } from './checkedin-visitors/checkedin-visitors.component';
import { SecurityAlertsComponent } from './security-alerts/security-alerts.component';
import { SecurityProfileComponent } from './security-profile/security-profile.component';
import { SecuritySendComponent } from './security-send/security-send.component';
import { VisitorsComponent } from './visitors/visitors.component';
import { StaffPassUpdateComponent } from './staff-pass-update/staff-pass-update.component';
import { AdminPassUpdateComponent } from './admin-pass-update/admin-pass-update.component';
import { SecurityPassUpdateComponent } from './security-pass-update/security-pass-update.component';
import { LockedComponent } from './locked/locked.component';
import { roleGuard } from './role.guard';
import { AdminRestrictedComponent } from './admin-restricted/admin-restricted.component';
import { VisitorRestrictedComponent } from './visitor-restricted/visitor-restricted.component';
import { StaffRestrictedComponent } from './staff-restricted/staff-restricted.component';
import { SecurityRestrictedComponent } from './security-restricted/security-restricted.component';
import { AdminCheckinLogsComponent } from './admin-checkin-logs/admin-checkin-logs.component';
import { SendComponent } from './send/send.component';
import { AdminSendComponent } from './admin-send/admin-send.component';
import { AdminProfileComponent } from './admin-profile/admin-profile.component';
import { AdminViewAlertsComponent } from './admin-view-alerts/admin-view-alerts.component';
import { AdminVisitsComponent } from './admin-visits/admin-visits.component';
import { AdminVisitorsComponent } from './admin-visitors/admin-visitors.component';
import { EmergencyInformationComponent } from './emergency-information/emergency-information.component';
import { GuestListComponent } from './guest-list/guest-list.component';
import { AdminEmergencyComponent } from './admin-emergency/admin-emergency.component';
import { BlacklistComponent } from './blacklist/blacklist.component';
import { AdminBlacklistComponent } from './admin-blacklist/admin-blacklist.component';
import { VisitorHeaderComponent } from './visitor-header/visitor-header.component';
import { VisitorSendComponent } from './visitor-send/visitor-send.component';
import { VisitorVisitsComponent } from './visitor-visits/visitor-visits.component';
import { VisitorEmergencyComponent } from './visitor-emergency/visitor-emergency.component';
import { MyAlertsComponent } from './my-alerts/my-alerts.component';
import { MyFlagsComponent } from './my-flags/my-flags.component';
import { StaffSendComponent } from './staff-send/staff-send.component';
import { StaffEmergencyComponent } from './staff-emergency/staff-emergency.component';
import { StaffVisitsComponent } from './staff-visits/staff-visits.component';
import { StaffGuestsComponent } from './staff-guests/staff-guests.component';
import { SecurityEmergencyComponent } from './security-emergency/security-emergency.component';
import { SecurityGuestListComponent } from './security-guest-list/security-guest-list.component';
import { VisitorCheckinComponent } from './visitor-checkin/visitor-checkin.component';
import { MainEmergencyComponent } from './main-emergency/main-emergency.component';

export const routes: Routes = [
  { path: '', component: MainHomeComponent },
  { path: 'mainheader', component: MainHeaderComponent },

  { path: 'information', component: MainEmergencyComponent },

  {
    path: 'staff-sidebar',
    component: StaffSidebarComponent,
    canActivate: [roleGuard(['staff'])],
  },

  {
    path: 'staff-send',
    component: StaffSendComponent,
    canActivate: [roleGuard(['staff'])],
  },

  {
    path: 'staff-emergency',
    component: StaffEmergencyComponent,
    canActivate: [roleGuard(['staff'])],
  },
  {
    path: 'visitor-sidebar',
    component: VisitorSidebarComponent,
    canActivate: [roleGuard(['visitor'])],
  },

  {
    path: 'visitor-header',
    component: VisitorHeaderComponent,
    canActivate: [roleGuard(['visitor'])],
  },
  {
    path: 'admin-sidebar',
    component: AdminSidebarComponent,
    canActivate: [roleGuard(['admin'])],
  },
  {
    path: 'admin-header',
    component: AdminHeaderComponent,
    canActivate: [roleGuard(['admin'])],
  },

  {
    path: 'guest-list',
    component: GuestListComponent,
  },

  {
    path: 'security-header',
    component: SecurityHeaderComponent,
    canActivate: [roleGuard(['security'])],
  },
  {
    path: 'security-sidebar',
    component: SecuritySidebarComponent,
    canActivate: [roleGuard(['security'])],
  },
  {
    path: 'security-dashboard',
    component: SecurityDashboardComponent,
    canActivate: [roleGuard(['security'])],
  },
  {
    path: 'staff-checkin',
    component: StaffCheckInComponent,
    canActivate: [roleGuard(['security'])],
  },

  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [roleGuard(['admin'])],
  },

  {
    path: 'admin-emergency',
    component: AdminEmergencyComponent,
    canActivate: [roleGuard(['admin'])],
  },

  {
    path: 'blacklist',
    component: BlacklistComponent,
  },

  {
    path: 'staff-view-alerts',
    component: StaffViewAlertsComponent,
    canActivate: [roleGuard(['staff'])],
  },

  {
    path: 'staff-visits',
    component: StaffVisitsComponent,
    canActivate: [roleGuard(['staff'])],
  },

  {
    path: 'staff-visitors',
    component: StaffGuestsComponent,
    canActivate: [roleGuard(['staff'])],
  },
  {
    path: 'visitor-view-alerts',
    component: VisitorViewAlertsComponent,
    canActivate: [roleGuard(['visitor'])],
  },
  {
    path: 'staffheader',
    component: StaffHeaderComponent,
    canActivate: [roleGuard(['staff'])],
  },
  {
    path: 'staff-dashboard',
    component: StaffDashboardComponent,
    canActivate: [roleGuard(['staff'])],
  },
  {
    path: 'manage-staff',
    component: UsersComponent,
    canActivate: [roleGuard(['admin'])],
  },
  { path: 'visitor-signin', component: VisitorSigninComponent },
  { path: 'visitor-signup', component: VisitorSignupComponent },
  {
    path: 'visitor-dashboard',
    component: VisitorDashboardComponent,
    canActivate: [roleGuard(['visitor'])],
  },
  { path: 'alerts', component: AlertsComponent },

  {
    path: 'checkin-logs',
    component: CheckinLogsComponent,
    canActivate: [roleGuard(['security', 'admin'])],
  },

  { path: 'my-alerts', component: MyAlertsComponent },

  { path: 'my-flags', component: MyFlagsComponent },

  {
    path: 'visitor-preregistration',
    component: VisitorPreregistratonComponent,
    canActivate: [roleGuard(['visitor'])],
  },
  {
    path: 'visits',
    component: VisitsComponent,
  },
  {
    path: 'flag',
    component: FlagComponent,
  },
  {
    path: 'flag-review',
    component: FlagReviewComponent,
  },
  {
    path: 'staff-flag',
    component: StaffFlagComponent,
    canActivate: [roleGuard(['staff'])],
  },

  {
    path: 'staff-flags',
    component: StaffFlagsComponent,
    canActivate: [roleGuard(['staff'])],
  },
  {
    path: 'visitor-flag',
    component: VisitorFlagComponent,
    canActivate: [roleGuard(['visitor'])],
  },

  {
    path: 'visitor-send',
    component: VisitorSendComponent,
    canActivate: [roleGuard(['visitor'])],
  },

  {
    path: 'visitor-visits',
    component: VisitorVisitsComponent,
    canActivate: [roleGuard(['visitor'])],
  },

  {
    path: 'visitor-emergency',
    component: VisitorEmergencyComponent,
    canActivate: [roleGuard(['visitor'])],
  },

  {
    path: 'admin-flag',
    component: AdminFlagComponent,
    canActivate: [roleGuard(['admin'])],
  },

  {
    path: 'admin-blacklist',
    component: AdminBlacklistComponent,
    canActivate: [roleGuard(['admin'])],
  },
  {
    path: 'send',
    component: SendComponent,
  },

  {
    path: 'visitor-flags',
    component: VisitorFlagsComponent,
    canActivate: [roleGuard(['visitor'])],
  },
  {
    path: 'admin-flags',
    component: AdminFlagsComponent,
    canActivate: [roleGuard(['admin'])],
  },
  {
    path: 'security-flags',
    component: SecurityFlagsComponent,
    canActivate: [roleGuard(['security'])],
  },

  {
    path: 'security-emergency',
    component: SecurityEmergencyComponent,
    canActivate: [roleGuard(['security'])],
  },
  {
    path: 'profile',
    component: ProfileComponent,
  },
  {
    path: 'visitor-profile',
    component: VisitorProfileComponent,
    canActivate: [roleGuard(['visitor'])],
  },
  {
    path: 'staff-profile',
    component: StaffProfileComponent,
    canActivate: [roleGuard(['staff'])],
  },
  {
    path: 'staff-signin',
    component: StaffSignInComponent,
  },
  {
    path: 'admin-signin',
    component: AdminSigninComponent,
  },
  {
    path: 'security-signin',
    component: SecuritySigninComponent,
  },

  {
    path: 'qr-checkin',
    component: QrscannerComponent,
    canActivate: [roleGuard(['security'])],
  },

  {
    path: 'checkedin-staff',
    component: CheckedinStaffComponent,
    canActivate: [roleGuard(['admin', 'security'])],
  },

  {
    path: 'checkedin-visitors',
    component: CheckedinVisitorsComponent,
    canActivate: [roleGuard(['admin', 'security'])],
  },

  {
    path: 'security-alerts',
    component: SecurityAlertsComponent,
    canActivate: [roleGuard(['security'])],
  },

  {
    path: 'security-guest-list',
    component: SecurityGuestListComponent,
    canActivate: [roleGuard(['security'])],
  },

  {
    path: 'visitor-checkin',
    component: VisitorCheckinComponent,
    canActivate: [roleGuard(['security'])],
  },

  {
    path: 'security-profile',
    component: SecurityProfileComponent,
    canActivate: [roleGuard(['security'])],
  },

  {
    path: 'security-send',
    component: SecuritySendComponent,
    canActivate: [roleGuard(['security'])],
  },

  {
    path: 'manage-visitors',
    component: VisitorsComponent,
    canActivate: [roleGuard(['admin'])],
  },

  {
    path: 'checkin-history',
    component: AdminCheckinLogsComponent,
    canActivate: [roleGuard(['admin'])],
  },

  {
    path: 'staff-update-password',
    component: StaffPassUpdateComponent,
    canActivate: [roleGuard(['staff'])],
  },

  {
    path: 'admin-update-password',
    component: AdminPassUpdateComponent,
    canActivate: [roleGuard(['admin'])],
  },

  {
    path: 'security-update-password',
    component: SecurityPassUpdateComponent,
    canActivate: [roleGuard(['security'])],
  },

  {
    path: 'locked',
    component: LockedComponent,
  },

  {
    path: 'staff-access-denied',
    component: StaffRestrictedComponent,
    canActivate: [roleGuard(['staff'])],
  },

  {
    path: 'admin-access-denied',
    component: AdminRestrictedComponent,
    canActivate: [roleGuard(['admin'])],
  },

  {
    path: 'visitor-access-denied',
    component: VisitorRestrictedComponent,
    canActivate: [roleGuard(['visitor'])],
  },

  {
    path: 'security-access-denied',
    component: SecurityRestrictedComponent,
    canActivate: [roleGuard(['security'])],
  },

  {
    path: 'admin-sends',
    component: AdminSendComponent,
    canActivate: [roleGuard(['admin'])],
  },

  {
    path: 'admin-profile',
    component: AdminProfileComponent,
    canActivate: [roleGuard(['admin'])],
  },

  {
    path: 'admin-views',
    component: AdminViewAlertsComponent,
    canActivate: [roleGuard(['admin'])],
  },

  {
    path: 'admin-guest-list',
    component: AdminVisitorsComponent,
    canActivate: [roleGuard(['admin'])],
  },

  {
    path: 'admin-visits',
    component: AdminVisitsComponent,
    canActivate: [roleGuard(['admin'])],
  },

  {
    path: 'emergency-information',
    component: EmergencyInformationComponent,
  },
];
