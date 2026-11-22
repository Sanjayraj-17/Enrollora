
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CourseService } from '../course.service';
import { CourseResponse, SaveCourseRequest } from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {

  private courseService = inject(CourseService);

  // Course data
  courses = signal<CourseResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  // Pagination
  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  // Form states
  isFormOpen = signal(false);
  isSaving = signal(false);
  editingCourseId = signal<number | null>(null);
  formError = signal('');

  // Course form data
  courseForm: SaveCourseRequest = this.emptyCourseForm();

  // Empty course form
  private emptyCourseForm(): SaveCourseRequest {
    return {
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 1,
      isActive: true
    };
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  // Load courses from backend
  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService.getCourses(
      this.pageNumber(),
      this.pageSize()
    ).subscribe({
      next: (response) => {
        this.courses.set(response.items);
        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.errorMessage.set('Unable to load courses.');
        this.isLoading.set(false);
      }
    });
  }

  // Open create course form
  openCreateForm(): void {
    this.editingCourseId.set(null);
    this.courseForm = this.emptyCourseForm();
    this.formError.set('');
    this.isFormOpen.set(true);
  }

  // Open edit course form
  openEditForm(course: CourseResponse): void {
    this.editingCourseId.set(course.courseId);

    this.courseForm = {
      courseName: course.courseName,
      duration: course.duration,
      fees: course.fees,
      capacity: course.capacity,
      isActive: course.isActive
    };

    this.formError.set('');
    this.isFormOpen.set(true);
  }

  // Close course form
  closeForm(): void {
    if (!this.isSaving()) {
      this.isFormOpen.set(false);
    }
  }

  // Save course (Create or Update)
  saveCourse(): void {

    const request: SaveCourseRequest = {
      courseName: this.courseForm.courseName.trim(),
      duration: this.courseForm.duration.trim(),
      fees: Number(this.courseForm.fees),
      capacity: Number(this.courseForm.capacity),
      isActive: this.courseForm.isActive
    };

    // Validation
    if (
      !request.courseName ||
      !request.duration ||
      !Number.isFinite(request.fees) ||
      request.fees < 0 ||
      !Number.isInteger(request.capacity) ||
      request.capacity < 1
    ) {
      this.formError.set(
        'Please enter valid course details.'
      );
      return;
    }

    this.isSaving.set(true);
    this.formError.set('');

    const courseId = this.editingCourseId();

    const operation = courseId === null
      ? this.courseService.createCourse(request)
      : this.courseService.updateCourse(courseId, request);

    operation.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isFormOpen.set(false);
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error saving course:', error);

        this.isSaving.set(false);

        this.formError.set(
          error?.error?.detail ||
          error?.error?.message ||
          'Unable to save course.'
        );
      }
    });
  }

  // Deactivate course
  deactivateCourse(course: CourseResponse): void {

    const confirmed = confirm(
      `Are you sure you want to deactivate ${course.courseName}?`
    );

    if (!confirmed) {
      return;
    }

    this.courseService.deactivateCourse(course.courseId).subscribe({
      next: () => {
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error deactivating course:', error);

        this.errorMessage.set(
          error?.error?.detail ||
          'Unable to deactivate course.'
        );
      }
    });
  }

  // Next page
  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update(page => page + 1);
      this.loadCourses();
    }
  }

  // Previous page
  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(page => page - 1);
      this.loadCourses();
    }
  }
}

