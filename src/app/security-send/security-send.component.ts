import { Component } from '@angular/core';
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';
import { SendComponent } from '../send/send.component';

@Component({
  selector: 'app-security-send',
  standalone: true,
  imports: [SecurityHeaderComponent, SecuritySidebarComponent, SendComponent],
  templateUrl: './security-send.component.html',
  styleUrl: './security-send.component.css',
})
export class SecuritySendComponent {}
