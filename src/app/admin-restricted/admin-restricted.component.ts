import { Component } from '@angular/core';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-restricted',
  imports: [AdminHeaderComponent, AdminSidebarComponent],
  templateUrl: './admin-restricted.component.html',
  styleUrl: './admin-restricted.component.css',
})
export class AdminRestrictedComponent {}
