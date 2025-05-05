import { Component } from '@angular/core';
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-security-dashboard',
  imports: [SecurityHeaderComponent, SecuritySidebarComponent, RouterModule],
  templateUrl: './security-dashboard.component.html',
  styleUrl: './security-dashboard.component.css',
})
export class SecurityDashboardComponent {}
