import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Employee {
    id: string;
    name: string;
    role: string;
    email: string;
    status?: string;
}

@Component({
    selector: 'app-employees',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="card shadow-sm mb-4">
            <div class="card-header bg-light d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div class="d-flex align-items-center gap-2">
                    <h5 class="mb-0">Employees of {{ companyName }}</h5>
                    <span class="badge bg-secondary" *ngIf="employees.length > 0">
                        {{ filteredEmployees.length }} / {{ employees.length }} Employees
                    </span>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <label for="empStatusFilter" class="small fw-semibold text-muted mb-0">Filter Status:</label>
                    <select id="empStatusFilter" class="form-select form-select-sm w-auto"
                        [ngModel]="selectedStatus" (ngModelChange)="onStatusFilterChange($event)">
                        <option value="All">All Statuses</option>
                        @for (st of statuses; track st) {
                            <option [value]="st">{{ st }}</option>
                        }
                    </select>
                </div>
            </div>
            <div class="card-body p-3">
                @if (filteredEmployees.length > 0) {
                    <div class="text-break">
                        @for (emp of filteredEmployees; track emp.id) {
                            <div class="app-grid-row employees-grid-row border-bottom" (click)="onRowClick(emp)" style="cursor: pointer;">
                                <div class="mb-1">
                                    <b>ID</b>
                                    <span class="fw-semibold">{{ emp.id }}</span>
                                </div>
                                <div class="mb-1">
                                    <b>Name</b>
                                    <button type="button" class="grid-link text-start" (click)="onRowClick(emp)">
                                        {{ emp.name }}
                                    </button>
                                </div>
                                <div class="mb-1">
                                    <b>Role</b>
                                    <span>{{ emp.role }}</span>
                                </div>
                                <div class="mb-1">
                                    <b>Email</b>
                                    <span class="text-muted">{{ emp.email }}</span>
                                </div>
                                <div class="mb-1">
                                    <b>Status</b>
                                    <span class="status-pill" [class]="'status-pill status-' + (emp.status || 'Active').toLowerCase().replace(' ', '-')">
                                        {{ emp.status || 'Active' }}
                                    </span>
                                </div>
                            </div>
                        }
                    </div>
                } @else {
                    <div class="p-4 text-center text-muted">
                        No employees found matching the selected status.
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
            .employees-grid-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 0.5rem 1rem;
                align-items: start;
                padding: 0.75rem 0.5rem;
                border-radius: 0.375rem;
                border-bottom: 1px solid #000 !important;
                transition: background-color 0.2s ease;

                &:hover {
                    background-color: #f8f9fa;
                }
            }
            .grid-link {
                background: none;
                border: 0;
                color: #0d6efd;
                font-weight: 700;
                padding: 0;
                text-decoration: underline;
                cursor: pointer;
            }
            b {
                display: block;
                color: #212529;
                font-size: 0.85rem;
                margin-bottom: 0.1rem;
            }
            .status-pill {
                display: inline-block;
                border-radius: 999px;
                padding: 0.05rem 0.55rem;
                font-size: 0.84rem;
                font-weight: 700;
            }
            .status-active {
                background-color: #d1e7dd;
                color: #0f5132;
            }
            .status-on-leave {
                background-color: #fff3cd;
                color: #664d03;
            }
            .status-terminated {
                background-color: #f8d7da;
                color: #842029;
            }
        `
    ]
})
export class EmployeesComponent {
    @Input() companyName: string = '';
    @Input() employees: Employee[] = [];

    @Output() employeeClicked = new EventEmitter<Employee>();

    selectedStatus: string = 'All';
    readonly statuses: string[] = ['Active', 'On Leave', 'Terminated'];

    get filteredEmployees(): Employee[] {
        if (!this.selectedStatus || this.selectedStatus === 'All') {
            return this.employees;
        }
        const target = this.selectedStatus.trim().toLowerCase();
        return this.employees.filter(emp => (emp.status || 'Active').trim().toLowerCase() === target);
    }

    onStatusFilterChange(status: string): void {
        this.selectedStatus = status;
    }

    onRowClick(employee: Employee): void {
        this.employeeClicked.emit(employee);
    }
}
