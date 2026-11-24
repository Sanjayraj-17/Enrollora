
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../../environments/environment';

interface EnrollmentResponse {
  enrollmentId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseName: string;
  enrolledAt: string;
  status: string | number;
}

interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

interface CancellationResponse {
  cancellationRequestId: number;
  enrollmentId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseName: string;
  reason: string;
  status: string | number;
  requestedAt: string;
  reviewedAt: string | null;
  adminRemarks: string | null;
}

interface CreateCancellationRequest {
  reason: string;
}

@Component({
  selector: 'app-my-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-enrollments.html',
  styleUrl: './my-enrollments.css',
})
export class MyEnrollments implements OnInit {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl;

  enrollments = signal<EnrollmentResponse[]>([]);
  cancellationRequests = signal<CancellationResponse[]>([]);

  isLoading = signal(false);
  isSubmitting = signal(false);

  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  selectedEnrollmentId: number | null = null;
  cancellationReason = '';

  ngOnInit(): void {
    this.loadData();
  }

  // Load enrollments and cancellation history.
  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const enrollmentParams = new HttpParams()
      .set('pageNumber', this.pageNumber().toString())
      .set('pageSize', this.pageSize().toString());

    this.http.get<PagedResult<EnrollmentResponse>>(
      `${this.apiUrl}/enrollments/my`,
      { params: enrollmentParams },
    ).subscribe({
      next: (response) => {
        this.enrollments.set(response.items ?? []);
        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);
        this.loadCancellationRequests();
      },
      error: (error) => {
        console.error('Error loading enrollments:', error);

        this.errorMessage.set(
          error?.error?.message ||
          error?.error?.title ||
          'Unable to load your enrollments.',
        );

        this.isLoading.set(false);
      },
    });
  }

  // Load cancellation request history.
  loadCancellationRequests(): void {
    const params = new HttpParams()
      .set('pageNumber', '1')
      .set('pageSize', '100');

    this.http.get<PagedResult<CancellationResponse>>(
      `${this.apiUrl}/cancellation-requests/my`,
      { params },
    ).subscribe({
      next: (response) => {
        this.cancellationRequests.set(response.items ?? []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading cancellation requests:', error);

        this.errorMessage.set(
          error?.error?.message ||
          error?.error?.title ||
          'Unable to load cancellation request history.',
        );

        this.isLoading.set(false);
      },
    });
  }

  // Open cancellation request form.
  openCancellationForm(enrollmentId: number): void {
    this.selectedEnrollmentId = enrollmentId;
    this.cancellationReason = '';

    this.errorMessage.set('');
    this.successMessage.set('');
  }

  // Close cancellation request form.
  closeCancellationForm(): void {
    this.selectedEnrollmentId = null;
    this.cancellationReason = '';
  }

  // Check whether an enrollment already has a pending request.
  hasPendingRequest(enrollmentId: number): boolean {
    return this.cancellationRequests().some(
      request =>
        request.enrollmentId === enrollmentId &&
        this.isPending(request.status),
    );
  }

  // Check active enrollment.
  isActive(status: string | number): boolean {
    return this.statusName(status, 'enrollment') === 'Active';
  }

  statusLabel(status: string | number): string {
    return this.statusName(status, 'enrollment');
  }

  // Check pending cancellation request.
  isPending(status: string | number): boolean {
    return this.statusName(status, 'cancellation') === 'Pending';
  }

  // Convert backend enum values into readable status names.
  statusName(
    status: string | number,
    type: 'enrollment' | 'cancellation' = 'enrollment',
  ): string {
    const value = typeof status === 'string'
      ? status.trim()
      : status;

    if (type === 'enrollment') {
      switch (value) {
        case 0:
        case '0':
        case 'Active':
          return 'Active';

        case 1:
        case '1':
        case 'Cancelled':
          return 'Cancelled';

        default:
          return 'Unknown';
      }
    }

    switch (value) {
      case 0:
      case '0':
      case 'Pending':
        return 'Pending';

      case 1:
      case '1':
      case 'Approved':
        return 'Approved';

      case 2:
      case '2':
      case 'Rejected':
        return 'Rejected';

      default:
        return 'Unknown';
    }
  }

  // Submit cancellation request.
  submitCancellationRequest(): void {
    if (this.selectedEnrollmentId === null) {
      return;
    }

    const reason = this.cancellationReason.trim();

    if (!reason) {
      this.errorMessage.set('Please enter a cancellation reason.');
      return;
    }

    if (reason.length > 500) {
      this.errorMessage.set(
        'Cancellation reason cannot exceed 500 characters.',
      );
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const request: CreateCancellationRequest = { reason };

    this.http.post<CancellationResponse>(
      `${this.apiUrl}/enrollments/${this.selectedEnrollmentId}/cancellation-request`,
      request,
    ).subscribe({
      next: () => {
        this.successMessage.set(
          'Cancellation request submitted successfully.',
        );

        this.closeCancellationForm();
        this.isSubmitting.set(false);

        // Reload both enrollments and cancellation history.
        this.loadData();
      },
      error: (error) => {
        console.error('Error submitting cancellation request:', error);

        this.errorMessage.set(
          error?.error?.message ||
          error?.error?.title ||
          'Unable to submit cancellation request.',
        );

        this.isSubmitting.set(false);
      },
    });
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(page => page - 1);
      this.loadData();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update(page => page + 1);
      this.loadData();
    }
  }

  // Refresh enrollment and cancellation data.
  refresh(): void {
    this.successMessage.set('');
    this.loadData();
  }
}
