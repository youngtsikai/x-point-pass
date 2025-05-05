import { Component } from '@angular/core';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';
import { AlertsComponent } from '../alerts/alerts.component';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';

@Component({
  selector: 'app-visitor-view-alerts',
  imports: [VisitorSidebarComponent, AlertsComponent, VisitorHeaderComponent],
  templateUrl: './visitor-view-alerts.component.html',
  styleUrl: './visitor-view-alerts.component.css',
})
export class VisitorViewAlertsComponent {}
