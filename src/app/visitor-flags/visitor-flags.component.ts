import { Component } from '@angular/core';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';
import { RouterModule } from '@angular/router';
import { MyFlagsComponent } from '../my-flags/my-flags.component';

@Component({
  selector: 'app-visitor-flags',
  imports: [
    VisitorHeaderComponent,
    VisitorSidebarComponent,
    RouterModule,
    MyFlagsComponent,
  ],
  templateUrl: './visitor-flags.component.html',
  styleUrl: './visitor-flags.component.css',
})
export class VisitorFlagsComponent {}
