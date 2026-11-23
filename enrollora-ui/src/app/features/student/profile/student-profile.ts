import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface StudentProfileResponse {
  studentId: number;
  name: string;
  email: string;
  department: string;
  age: number;
  cgpa: number;
  status: string | number;
  registeredAt: string;
  reviewedAt: string | null;
}

interface UpdateStudentProfileRequest {
  name: string;
  department: string;
  age: number;
}

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.css',
})
export class StudentProfile implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/students/me`;

  profile = signal<StudentProfileResponse | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  form: UpdateStudentProfileRequest = {
    name: '',
    department: '',
    age: 17,
  };

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.http.get<StudentProfileResponse>(this.apiUrl).subscribe({
      next: (response) => {
        this.profile.set(response);
        this.form = {
          name: response.name,
          department: response.department,
          age: response.age,
        };
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading student profile:', error);
        this.errorMessage.set(
          error?.error?.message ||
          error?.error?.title ||
          'Unable to load your profile. Please try again.',
        );
        this.isLoading.set(false);
      },
    });
  }

  updateProfile(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const request: UpdateStudentProfileRequest = {
      name: this.form.name.trim(),
      department: this.form.department.trim(),
      age: Number(this.form.age),
    };

    if (!request.name || !request.department) {
      this.errorMessage.set('Name and department are required.');
      return;
    }

    if (!Number.isInteger(request.age) || request.age < 17 || request.age > 60) {
      this.errorMessage.set('Age must be between 17 and 60.');
      return;
    }

    this.isSaving.set(true);

    this.http.put<StudentProfileResponse>(this.apiUrl, request).subscribe({
      next: (response) => {
        this.profile.set(response);
        this.form = {
          name: response.name,
          department: response.department,
          age: response.age,
        };
        this.successMessage.set('Your profile has been updated successfully.');
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Error updating student profile:', error);
        this.errorMessage.set(
          error?.error?.message ||
          error?.error?.title ||
          'Unable to update your profile. Please try again.',
        );
        this.isSaving.set(false);
      },
    });
  }
}
