
using Enrollora.Api.DTOs;
using Enrollora.Api.Models;
using Enrollora.Api.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Enrollora.Api.Services;

public sealed class StudentService(IRepository<Student> students) : IStudentService
{
    // Get students with search, filters, sorting and pagination.
    public async Task<PagedResult<StudentResponse>> GetStudentsAsync(
        StudentQuery query, CancellationToken ct)
    {
        query.Normalize();
        var q = students.Query();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            q = q.Where(x => x.Name.Contains(term) || x.Email.Contains(term));
        }

        if (query.Status.HasValue)
            q = q.Where(x => x.Status == query.Status);

        if (!string.IsNullOrWhiteSpace(query.Department))
            q = q.Where(x => x.Department == query.Department);

        if (query.MinAge.HasValue)
            q = q.Where(x => x.Age >= query.MinAge);

        if (query.MaxAge.HasValue)
            q = q.Where(x => x.Age <= query.MaxAge);

        if (query.MinCgpa.HasValue)
            q = q.Where(x => x.CGPA >= query.MinCgpa);

        if (query.MaxCgpa.HasValue)
            q = q.Where(x => x.CGPA <= query.MaxCgpa);

        q = (query.SortBy?.ToLowerInvariant(), query.SortOrder) switch
        {
            ("name", "desc") => q.OrderByDescending(x => x.Name),
            ("age", "desc") => q.OrderByDescending(x => x.Age),
            ("age", _) => q.OrderBy(x => x.Age),
            ("cgpa", "desc") => q.OrderByDescending(x => x.CGPA),
            ("cgpa", _) => q.OrderBy(x => x.CGPA),
            ("registeredat", "desc") => q.OrderByDescending(x => x.RegisteredAt),
            ("registeredat", _) => q.OrderBy(x => x.RegisteredAt),
            ("name", _) => q.OrderBy(x => x.Name),
            _ => q.OrderByDescending(x => x.RegisteredAt)
        };

        var page = await QueryHelpers.ToPagedResultAsync(q, query, ct);

        return new PagedResult<StudentResponse>(
            page.Items.Select(Map).ToList(),
            page.PageNumber,
            page.PageSize,
            page.TotalRecords,
            page.TotalPages);
    }

    // Get one student by ID.
    public async Task<StudentResponse> GetByIdAsync(int id, CancellationToken ct) =>
        Map(await FindAsync(id, ct));

    // Get the currently logged-in student's profile.
    public async Task<StudentResponse> GetMeAsync(int studentId, CancellationToken ct) =>
        Map(await FindAsync(studentId, ct));

    // Student updates their own profile.
    // CGPA, email and status cannot be modified here.
    public async Task<StudentResponse> UpdateMeAsync(
        int studentId,
        UpdateStudentProfileRequest request,
        CancellationToken ct)
    {
        var student = await FindAsync(studentId, ct);

        student.Name = request.Name.Trim();
        student.Department = request.Department.Trim();
        student.Age = request.Age;

        students.Update(student);
        await students.SaveChangesAsync(ct);

        return Map(student);
    }

    // Administrator updates student details, including CGPA.
    public async Task<StudentResponse> UpdateAsync(
        int id,
        UpdateStudentRequest request,
        CancellationToken ct)
    {
        var student = await FindAsync(id, ct);

        student.Name = request.Name.Trim();
        student.Department = request.Department.Trim();
        student.Age = request.Age;
        student.CGPA = request.CGPA;

        students.Update(student);
        await students.SaveChangesAsync(ct);

        return Map(student);
    }

    // Approve or reject a pending student registration.
    public async Task ReviewAsync(
        int id, StudentStatus status, CancellationToken ct)
    {
        if (status is not (StudentStatus.Approved or StudentStatus.Rejected))
            throw new ArgumentException("Review status must be Approved or Rejected.");

        var student = await FindAsync(id, ct);

        if (student.Status != StudentStatus.Pending)
            throw new InvalidOperationException(
                "Only pending registrations can be reviewed.");

        student.Status = status;
        student.ReviewedAt = DateTime.UtcNow;

        students.Update(student);
        await students.SaveChangesAsync(ct);
    }

    // Delete a student only when there is no enrollment history.
    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var student = await FindAsync(id, ct);

        if (await students.Query()
            .Where(x => x.StudentId == id)
            .SelectMany(x => x.Enrollments)
            .AnyAsync(ct))
        {
            throw new InvalidOperationException(
                "Student has enrollment history and cannot be deleted.");
        }

        students.Remove(student);
        await students.SaveChangesAsync(ct);
    }

    // Find student or return a not-found error.
    private async Task<Student> FindAsync(int id, CancellationToken ct) =>
        await students.Query(true)
            .FirstOrDefaultAsync(x => x.StudentId == id, ct)
        ?? throw new KeyNotFoundException("Student was not found.");

    // Convert database entity into API response.
    private static StudentResponse Map(Student x) =>
        new(
            x.StudentId,
            x.Name,
            x.Email,
            x.Department,
            x.Age,
            x.CGPA,
            x.Status,
            x.RegisteredAt,
            x.ReviewedAt);
}
