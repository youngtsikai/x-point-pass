import { Component } from '@angular/core';
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';
import { AlertsComponent } from '../alerts/alerts.component';

@Component({
  selector: 'app-security-alerts',
  imports: [SecurityHeaderComponent, SecuritySidebarComponent, AlertsComponent],
  templateUrl: './security-alerts.component.html',
  styleUrl: './security-alerts.component.css',
})
export class SecurityAlertsComponent {}
