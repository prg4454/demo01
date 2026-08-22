import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockCompany } from './master.component';
import { Employee } from './employees.component';
import { CheckRecord } from './checks.component';

@Component({
    selector: 'app-breadcrumbs',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="breadcrumb bg-light p-2 rounded mb-4 small d-flex flex-wrap align-items-center gap-2 border">
            <span class="text-muted fw-medium me-1">Current Context:</span>
            <span class="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">
                🏢 {{ selectedCompany?.name || 'No Company Selected' }}
            </span>
            @if (selectedEmployee) {
                <span class="text-muted">➔</span>
                <span class="badge bg-primary-subtle text-primary-emphasis border border-primary-subtle">
                    👤 Employee: {{ selectedEmployee.name }} ({{ selectedEmployee.role }})
                </span>
            }
            @if (selectedCheck) {
                <span class="text-muted">➔</span>
                <span class="badge bg-success-subtle text-success-emphasis border border-success-subtle">
                    💵 Paycheck: {{ selectedCheck.checkNumber }} (Issued: {{ selectedCheck.date }})
                </span>
            }
        </div>
    `
})
export class BreadcrumbsComponent {
    @Input() selectedCompany: MockCompany | null = null;
    @Input() selectedEmployee: Employee | null = null;
    @Input() selectedCheck: CheckRecord | null = null;
}

