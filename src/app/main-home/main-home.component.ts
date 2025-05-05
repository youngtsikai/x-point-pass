import { Component } from '@angular/core';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-home',
  imports: [RouterModule, MainHeaderComponent],
  templateUrl: './main-home.component.html',
  styleUrl: './main-home.component.css'
})
export class MainHomeComponent {

}
