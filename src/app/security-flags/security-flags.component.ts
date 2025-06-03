import { Component } from '@angular/core';
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';
import { FlagReviewComponent } from '../flag-review/flag-review.component';

@Component({
  selector: 'app-security-flags',
  imports: [
    SecurityHeaderComponent,
    SecuritySidebarComponent,
    FlagReviewComponent,
  ],
  templateUrl: './security-flags.component.html',
  styleUrl: './security-flags.component.css',
})
export class SecurityFlagsComponent {}
