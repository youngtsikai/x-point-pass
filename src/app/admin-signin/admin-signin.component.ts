import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-signin',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule, MainHeaderComponent],
  templateUrl: './admin-signin.component.html',
  styleUrl: './admin-signin.component.css',
})
export class AdminSigninComponent {
  authserv = inject(AuthService);
  rout = inject(Router);

  userData = {
    email: '',
    password: '',
  };

  onSubmit(): void {
    this.authserv
      .signin(this.userData.email, this.userData.password)
      .subscribe({
        next: () => {
          const userId = this.rout.navigateByUrl('/admin-dashboard');
        },
        error: (error) => {
          console.error('Sign-in failed:', error);
          let errorMessage = 'Sign-in Failed. Please try again.';
          if (error & error.message) {
            errorMessage = error.message;
          }
          alert(errorMessage);
        },
      });
  }
}
