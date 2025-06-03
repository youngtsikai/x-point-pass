import { Component } from '@angular/core';
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';
import { ProfileComponent } from '../profile/profile.component';

@Component({
  selector: 'app-security-profile',
  imports: [
    SecurityHeaderComponent,
    SecuritySidebarComponent,
    ProfileComponent,
  ],
  templateUrl: './security-profile.component.html',
  styleUrl: './security-profile.component.css',
})
export class SecurityProfileComponent {}
