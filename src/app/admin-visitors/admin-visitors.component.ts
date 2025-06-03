import { Component } from '@angular/core';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { GuestListComponent } from '../guest-list/guest-list.component';

@Component({
  selector: 'app-admin-visitors',
  imports: [AdminHeaderComponent, AdminSidebarComponent, GuestListComponent],
  templateUrl: './admin-visitors.component.html',
  styleUrl: './admin-visitors.component.css',
})
export class AdminVisitorsComponent {}
