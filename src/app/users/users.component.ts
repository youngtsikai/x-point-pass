import { Component, OnInit, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // Import HttpClient

import { CommonModule } from '@angular/common';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';

interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  phoneNumber?: string;
  accountCreated?: boolean;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminHeaderComponent,
    AdminSidebarComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  users$: Observable<User[]>;
  firestore: Firestore = inject(Firestore);
  authService: AuthService = inject(AuthService);
  http: HttpClient = inject(HttpClient);
  qrCodeImage: string = '';
  newUser: {
    name: string;
    email: string;
    role: string;
    password?: string;
    phoneNumber?: string;
    accountCreated?: boolean;
  } = {
    name: '',
    email: '',
    role: '',
    password: '',
    phoneNumber: '',
    accountCreated: false,
  };

  constructor() {
    const usersCollection = collection(this.firestore, 'users');
    this.users$ = collectionData(usersCollection, {
      idField: 'id',
    }) as Observable<User[]>;
  }

  ngOnInit(): void {
    // Data is fetched via the observable
  }

  async createUser() {
    if (
      this.newUser.email &&
      this.newUser.password &&
      this.newUser.name &&
      this.newUser.role &&
      this.newUser.phoneNumber
    ) {
      try {
        const userCredentialPromise = this.authService.signup(
          this.newUser.email,
          this.newUser.name,
          this.newUser.password,
          this.newUser.role,
          this.newUser.phoneNumber
        );
        const userCredential = await userCredentialPromise;
        if (userCredential?.user?.uid) {
          const uid = userCredential.user.uid;
          const usersCollection = collection(this.firestore, 'users');
          const collectionSnapshot = await getDocs(usersCollection);
          if (collectionSnapshot.empty) {
            console.warn(
              "Collection 'users' does not exist, but it will be created implicitly by setDoc."
            );
          }
          const newUserDoc = doc(usersCollection, uid);
          await setDoc(newUserDoc, {
            uid: uid,
            name: this.newUser.name!,
            email: this.newUser.email!,
            role: this.newUser.role!,
            phoneNumber: this.newUser.phoneNumber!,
            accountCreated: true,
          });
          console.log('Account created successfully!');
          this.newUser = {
            name: '',
            email: '',
            role: '',
            password: '',
            phoneNumber: '',
            accountCreated: false,
          };

          // Re-initialize the users$ Observable
          this.users$ = collectionData(usersCollection, {
            idField: 'id',
          }) as Observable<User[]>;
        }
      } catch (error: any) {
        console.error('Error creating user:', error);
        if (error.code === 'auth/email-already-in-use') {
          alert(
            'This email address is already registered. Please use a different email.'
          );
        } else {
          alert(`Error creating account: ${error.message}`);
        }
      }
    } else {
      console.warn('Please fill in all required fields for the new user.');
    }
  }

  generateUserQRCode(user: User) {
    const backendUrl = 'http://localhost:5000/generate_qr';
    console.log('User data being sent for QR:', user);

    this.http
      .post<{ image: string }>(backendUrl, {
        uid: user.id, // Use the user's ID from Firestore
        name: user.name,
        role: user.role,
        phone: user.phoneNumber, // Ensure the backend expects 'phone'
      })
      .subscribe({
        next: (response) => {
          this.qrCodeImage = 'data:image/png;base64,' + response.image;
          console.log('QR Code received:', this.qrCodeImage);
          // The QR code image is now stored in this.qrCodeImage and will be displayed in the template
        },
        error: (error) => {
          console.error('Error generating QR code from backend:', error);
          // Handle the error
        },
      });
  }

  downloadUserQRCode(user: User) {
    const backendUrl = 'http://localhost:5000/generate_qr';
    console.log('User data being sent for QR download:', user);

    this.http
      .post<{ image: string }>(backendUrl, {
        uid: user.id,
        name: user.name,
        role: user.role,
        phone: user.phoneNumber,
      })
      .subscribe({
        next: (response) => {
          const base64Image = 'data:image/png;base64,' + response.image;
          const link = document.createElement('a');
          link.href = base64Image;
          link.download = `user_${user.name.replace(/\s+/g, '_')}_qrcode.png`; // Create a filename
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link); // Clean up the temporary link
          console.log('QR Code download initiated');
        },
        error: (error) => {
          console.error('Error generating QR code for download:', error);
          alert('Failed to generate and download QR code.');
        },
      });
  }

  printUserQRCode(user: User) {
    const backendUrl = 'http://localhost:5000/generate_qr';
    console.log('User data being sent for QR printing:', user);

    this.http
      .post<{ image: string }>(backendUrl, {
        uid: user.id,
        name: user.name,
        role: user.role,
        phone: user.phoneNumber,
      })
      .subscribe({
        next: (response) => {
          const base64Image = 'data:image/png;base64,' + response.image;
          const printWindow = window.open('', '_blank', 'width=400,height=400');
          if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(`
              <html>
                 <head>
                   <title>Print QR Code</title>
                   <style>
                     body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                     img { max-width: 90%; max-height: 90%; }
                   </style>
                 </head>
                 <body>
                   <img src="${base64Image}" alt="QR Code">
                   <script>
                     window.onload = function() {
                       window.print();
                       window.onafterprint = function() {
                         window.close();
                       }
                     }
                   </script>
                 </body>
               </html>
             `);
            printWindow.document.close();
          } else {
            alert('Failed to open print window.');
          }
        },
        error: (error) => {
          console.error('Error generating QR code for printing:', error);
          alert('Failed to generate QR code for printing.');
        },
      });
  }

  async deleteUser(userId: string | undefined) {
    if (userId) {
      try {
        const userDocRef = doc(this.firestore, 'users', userId);
        await deleteDoc(userDocRef);
        console.log('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    } else {
      console.warn('Cannot delete user without an ID.');
    }
  }

  editUser(user: User): void {
    console.log('Edit user clicked for:', user);
    // Implement your edit logic here
  }
}
