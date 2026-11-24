
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

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

interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

interface ReviewCancellationRequest {
  adminRemarks: string;
}

@Component({
  selector: 'app-admin-cancellation-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css',
})
export class CancellationRequests implements OnInit {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/cancellation-requests`;

  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  isReviewing = signal(false);

  errorMessage = signal('');
  successMessage = signal('');

  selectedRequest: CancellationResponse | null = null;
  adminRemarks = '';
  reviewAction: 'approve' | 'reject' = 'approve';

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const params = new HttpParams()
      .set('pageNumber', '1')
      .set('pageSize', '100');

    this.http.get<PagedResult<CancellationResponse>>(
      this.apiUrl,
      { params },
    ).subscribe({
      next: (response) => {
        this.requests.set(response.items ?? []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading cancellation requests:', error);
        this.errorMessage.set(
          error?.error?.message ||
          error?.error?.title ||
          'Unable to load cancellation requests.',
        );
        this.isLoading.set(false);
      },
    });
  }

  statusName(status: string | number): string {
    if (typeof status === 'string') {
      return status;
    }

    const statuses = ['Pending', 'Approved', 'Rejected'];
    return statuses[status] ?? 'Unknown';
  }

  openReview(
    request: CancellationResponse,
    action: 'approve' | 'reject',
  ): void {
    this.selectedRequest = request;
    this.reviewAction = action;
    this.adminRemarks = '';
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeReview(): void {
    this.selectedRequest = null;
    this.adminRemarks = '';
  }

  submitReview(): void {
    if (!this.selectedRequest || this.isReviewing()) {
      return;
    }

    const requestId = this.selectedRequest.cancellationRequestId;
    const endpoint = `${this.apiUrl}/${requestId}/${this.reviewAction}`;

    const body: ReviewCancellationRequest = {
      adminRemarks: this.adminRemarks.trim(),
    };

    this.isReviewing.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.http.put<CancellationResponse>(endpoint, body).subscribe({
      next: (response) => {
        this.requests.update(current =>
          current.map(item =>
            item.cancellationRequestId === response.cancellationRequestId
              ? response
              : item,
          ),
        );

        this.successMessage.set(
          `Cancellation request ${this.reviewAction === 'approve' ? 'approved' : 'rejected'} successfully.`,
        );

        this.closeReview();
        this.isReviewing.set(false);
      },
      error: (error) => {
        console.error('Error reviewing cancellation request:', error);
        this.errorMessage.set(
          error?.error?.message ||
          error?.error?.title ||
          'Unable to review this cancellation request.',
        );
        this.isReviewing.set(false);
      },
    });
  }

  refresh(): void {
    this.successMessage.set('');
    this.loadRequests();
  }
}
