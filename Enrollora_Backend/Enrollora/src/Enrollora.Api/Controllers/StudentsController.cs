
using System.Security.Claims;
using Enrollora.Api.DTOs;
using Enrollora.Api.Models;
using Enrollora.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Enrollora.Api.Controllers;

[ApiController]
[Route("api/students")]
[Authorize]
public sealed class StudentsController(IStudentService service) : ControllerBase
{
    // Administrator: Get all students with filtering and pagination.
    [HttpGet]
    [Authorize(Roles = "Administrator")]
    public Task<PagedResult<StudentResponse>> GetAll(
        [FromQuery] StudentQuery query, CancellationToken ct) =>
        service.GetStudentsAsync(query, ct);

    // Administrator: Get student by ID.
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Administrator")]
    public Task<StudentResponse> GetById(int id, CancellationToken ct) =>
        service.GetByIdAsync(id, ct);

    // Student: Get their own profile.
    [HttpGet("me")]
    [Authorize(Roles = "Student")]
    public Task<StudentResponse> GetMe(CancellationToken ct) =>
        service.GetMeAsync(CurrentStudentId(), ct);

    // Student: Update their own profile.
    // CGPA cannot be changed through this endpoint.
    [HttpPut("me")]
    [Authorize(Roles = "Student")]
    public Task<StudentResponse> UpdateMe(
        UpdateStudentProfileRequest request, CancellationToken ct) =>
        service.UpdateMeAsync(CurrentStudentId(), request, ct);

    // Administrator: Update student details, including CGPA.
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrator")]
    public Task<StudentResponse> Update(
        int id, UpdateStudentRequest request, CancellationToken ct) =>
        service.UpdateAsync(id, request, ct);

    // Administrator: Approve student registration.
    [HttpPut("{id:int}/approve")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Approve(int id, CancellationToken ct)
    {
        await service.ReviewAsync(id, StudentStatus.Approved, ct);
        return Ok(new ApiMessage("Student approved."));
    }

    // Administrator: Reject student registration.
    [HttpPut("{id:int}/reject")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Reject(int id, CancellationToken ct)
    {
        await service.ReviewAsync(id, StudentStatus.Rejected, ct);
        return Ok(new ApiMessage("Student registration rejected."));
    }

    // Administrator: Delete student.
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await service.DeleteAsync(id, ct);
        return Ok(new ApiMessage("Student deleted."));
    }

    // Get the logged-in student's ID from the JWT token.
    private int CurrentStudentId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("Student identity is missing."));
}
