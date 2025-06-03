import { Component } from '@angular/core';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';

@Component({
  selector: 'app-staff-restricted',
  imports: [StaffHeaderComponent, StaffSidebarComponent],
  templateUrl: './staff-restricted.component.html',
  styleUrl: './staff-restricted.component.css',
})
export class StaffRestrictedComponent {}
