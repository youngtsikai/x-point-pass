import { Component } from '@angular/core';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';
import { FlagComponent } from '../flag/flag.component';

@Component({
  selector: 'app-staff-flag',
  imports: [StaffHeaderComponent, StaffSidebarComponent, FlagComponent],
  templateUrl: './staff-flag.component.html',
  styleUrl: './staff-flag.component.css',
})
export class StaffFlagComponent {}
