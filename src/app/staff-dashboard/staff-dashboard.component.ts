import { Component } from '@angular/core';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-staff-dashboard',
  imports: [StaffHeaderComponent, StaffSidebarComponent, RouterModule],
  templateUrl: './staff-dashboard.component.html',
  styleUrl: './staff-dashboard.component.css'
})
export class StaffDashboardComponent {

}
