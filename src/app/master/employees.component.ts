import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Employee {
    id: string;
    name: string;
    role: string;
    email: string;
}

@Component({
    selector: 'app-employees',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="card shadow-sm mb-4">
            <div class="card-header bg-light">
                <h5 class="mb-0">Employees of {{ companyName }}</h5>
            </div>
            <div class="card-body p-0">
                @if (employees.length > 0) {
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th scope="col" class="ps-3">ID</th>
                                    <th scope="col">Name</th>
                                    <th scope="col">Role</th>
                                    <th scope="col" class="pe-3">Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (emp of employees; track emp.id) {
                                    <tr (click)="onRowClick(emp)" style="cursor: pointer;">
                                        <td class="fw-semibold ps-3">{{ emp.id }}</td>
                                        <td class="text-primary fw-medium">{{ emp.name }}</td>
                                        <td>{{ emp.role }}</td>
                                        <td class="text-muted pe-3">{{ emp.email }}</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                } @else {
                    <div class="p-4 text-center text-muted">
                        No employees found for this company.
                    </div>
                }
            </div>
        </div>
    `,
    styles: [
        `
            .card {
                border-radius: 8px;
                overflow: hidden;
            }
            .table {
                margin-bottom: 0;
                td {
                    vertical-align: middle;
                }
            }
        `
    ]
})
export class EmployeesComponent {
    @Input() companyName: string = '';
    @Input() employees: Employee[] = [];

    @Output() employeeClicked = new EventEmitter<Employee>();

    onRowClick(employee: Employee): void {
        this.employeeClicked.emit(employee);
    }
}

