import { Component } from '@angular/core';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';

@Component({
  selector: 'app-visitor-restricted',
  imports: [VisitorHeaderComponent, VisitorSidebarComponent],
  templateUrl: './visitor-restricted.component.html',
  styleUrl: './visitor-restricted.component.css',
})
export class VisitorRestrictedComponent {}
