import { Component } from '@angular/core';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { FlagComponent } from '../flag/flag.component';
import { FlagReviewComponent } from '../flag-review/flag-review.component';

@Component({
  selector: 'app-admin-flags',
  imports: [AdminHeaderComponent, AdminSidebarComponent, FlagReviewComponent],
  templateUrl: './admin-flags.component.html',
  styleUrl: './admin-flags.component.css',
})
export class AdminFlagsComponent {}
