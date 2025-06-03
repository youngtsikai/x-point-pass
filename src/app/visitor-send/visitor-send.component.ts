import { Component } from '@angular/core';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';
import { SendComponent } from '../send/send.component';

@Component({
  selector: 'app-visitor-send',
  imports: [VisitorHeaderComponent, VisitorSidebarComponent, SendComponent],
  templateUrl: './visitor-send.component.html',
  styleUrl: './visitor-send.component.css',
})
export class VisitorSendComponent {}
