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
import { FlagViewsComponent } from './flag-views/flag-views.component';
import { AdminSidebarComponent } from './admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from './admin-header/admin-header.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { StaffViewAlertsComponent } from './staff-view-alerts/staff-view-alerts.component';
import { VisitorViewAlertsComponent } from './visitor-view-alerts/visitor-view-alerts.component';
import { SecurityHeaderComponent } from './security-header/security-header.component';
import { SecuritySidebarComponent } from './security-sidebar/security-sidebar.component';
import { SecurityDashboardComponent } from './security-dashboard/security-dashboard.component';
import { StaffCheckInComponent } from './staff-check-in/staff-check-in.component';
import { FacialRecognitionComponent } from './facial-recognition/facial-recognition.component';
import { QrCodeScannerComponent } from './qr-code-scanner/qr-code-scanner.component';
import { UsersComponent } from './users/users.component';
import { CheckinLogsComponent } from './checkin-logs/checkin-logs.component';
import { VisitorPreregistratonComponent } from './visitor-preregistraton/visitor-preregistraton.component';

export const routes: Routes = [
  { path: '', component: MainHomeComponent },
  { path: 'mainheader', component: MainHeaderComponent },
  { path: 'staff-sidebar', component: StaffSidebarComponent },
  { path: 'visitor-sidebar', component: VisitorSidebarComponent },
  { path: 'admin-sidebar', component: AdminSidebarComponent },
  { path: 'admin-header', component: AdminHeaderComponent },
  { path: 'security-header', component: SecurityHeaderComponent },
  { path: 'security-sidebar', component: SecuritySidebarComponent },
  { path: 'security-dashboard', component: SecurityDashboardComponent },
  { path: 'staff-checkin', component: StaffCheckInComponent },
  { path: 'qr-code-scan', component: QrCodeScannerComponent },
  { path: 'facial-scan', component: FacialRecognitionComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'staff-view-alerts', component: StaffViewAlertsComponent },
  { path: 'visitor-view-alerts', component: VisitorViewAlertsComponent },
  { path: 'view-flags', component: FlagViewsComponent },
  { path: 'staffheader', component: StaffHeaderComponent },
  { path: 'staff-dashboard', component: StaffDashboardComponent },
  { path: 'users', component: UsersComponent },
  { path: 'visitor-signin', component: VisitorSigninComponent },
  { path: 'visitor-signup', component: VisitorSignupComponent },
  { path: 'visitor-dashboard', component: VisitorDashboardComponent },
  { path: 'alerts', component: AlertsComponent },
  { path: 'checkin-logs', component: CheckinLogsComponent },
  {
    path: 'visitor-preregistration',
    component: VisitorPreregistratonComponent,
  },
];
