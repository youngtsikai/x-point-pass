import { Component } from '@angular/core';
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-staff-check-in',
  imports: [SecurityHeaderComponent, RouterModule],
  templateUrl: './staff-check-in.component.html',
  styleUrl: './staff-check-in.component.css',
})
export class StaffCheckInComponent {}
