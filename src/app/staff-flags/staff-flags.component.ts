import { Component } from '@angular/core';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { MyFlagsComponent } from '../my-flags/my-flags.component';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';

@Component({
  selector: 'app-staff-flags',
  imports: [StaffHeaderComponent, MyFlagsComponent, StaffSidebarComponent],
  templateUrl: './staff-flags.component.html',
  styleUrl: './staff-flags.component.css',
})
export class StaffFlagsComponent {}
