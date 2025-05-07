import { Component } from '@angular/core';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';
import { ProfileComponent } from '../profile/profile.component';

@Component({
  selector: 'app-staff-profile',
  imports: [StaffHeaderComponent, StaffSidebarComponent, ProfileComponent],
  templateUrl: './staff-profile.component.html',
  styleUrl: './staff-profile.component.css',
})
export class StaffProfileComponent {}
