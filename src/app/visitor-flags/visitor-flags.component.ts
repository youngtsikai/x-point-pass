import { Component } from '@angular/core';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';
import { FlagReviewComponent } from '../flag-review/flag-review.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-visitor-flags',
  imports: [
    VisitorHeaderComponent,
    VisitorSidebarComponent,
    FlagReviewComponent,
    RouterModule,
  ],
  templateUrl: './visitor-flags.component.html',
  styleUrl: './visitor-flags.component.css',
})
export class VisitorFlagsComponent {}
