import { Component } from '@angular/core';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { MyAlertsComponent } from '../my-alerts/my-alerts.component';

@Component({
  selector: 'app-visitor-view-alerts',
  imports: [VisitorSidebarComponent, VisitorHeaderComponent, MyAlertsComponent],
  templateUrl: './visitor-view-alerts.component.html',
  styleUrl: './visitor-view-alerts.component.css',
})
export class VisitorViewAlertsComponent {}
