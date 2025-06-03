import { Component } from '@angular/core';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { ProfileComponent } from '../profile/profile.component';

@Component({
  selector: 'app-admin-profile',
  imports: [AdminHeaderComponent, AdminSidebarComponent, ProfileComponent],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.css',
})
export class AdminProfileComponent {}
