import { Component, inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainHeaderComponent } from '../main-header/main-header.component';

@Component({
  selector: 'app-security-signin',
  imports: [RouterModule, CommonModule, FormsModule, MainHeaderComponent],
  templateUrl: './security-signin.component.html',
  styleUrl: './security-signin.component.css',
})
export class SecuritySigninComponent {
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
          const userId = this.rout.navigateByUrl('/security-dashboard');
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
