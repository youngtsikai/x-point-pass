import { Component } from '@angular/core';
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';

@Component({
  selector: 'app-security-restricted',
  imports: [SecurityHeaderComponent, SecuritySidebarComponent],
  templateUrl: './security-restricted.component.html',
  styleUrl: './security-restricted.component.css',
})
export class SecurityRestrictedComponent {}
