import { Component } from '@angular/core';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { VisitsComponent } from '../visits/visits.component';

@Component({
  selector: 'app-admin-visits',
  imports: [AdminHeaderComponent, AdminSidebarComponent, VisitsComponent],
  templateUrl: './admin-visits.component.html',
  styleUrl: './admin-visits.component.css',
})
export class AdminVisitsComponent {}
