import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CheckRecord {
    checkNumber: string;
    date: string;
    amount: number;
    status: string;
    employeeName?: string;
}

@Component({
    selector: 'app-checks',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="card shadow-sm mb-4">
            <div class="card-header bg-light">
                <h5 class="mb-0">{{ hasEmployeeNames() ? 'Company Paychecks Registry' : 'Paychecks for ' + employeeName }}</h5>
            </div>
            <div class="card-body p-0">
                @if (checks.length > 0) {
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th scope="col" class="ps-3">Check #</th>
                                    @if (hasEmployeeNames()) {
                                        <th scope="col">Employee</th>
                                    }
                                    <th scope="col">Date</th>
                                    <th scope="col">Amount</th>
                                    <th scope="col" class="pe-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (check of checks; track check.checkNumber) {
                                    <tr (click)="onRowClick(check)" style="cursor: pointer;">
                                        <td class="fw-semibold ps-3">{{ check.checkNumber }}</td>
                                        @if (check.employeeName) {
                                            <td class="fw-medium text-dark">{{ check.employeeName }}</td>
                                        }
                                        <td class="text-primary fw-medium">{{ check.date }}</td>
                                        <td class="fw-medium text-success">\${{ check.amount | number:'1.2-2' }}</td>
                                        <td class="pe-3">
                                            <span class="badge bg-success text-white">
                                                {{ check.status }}
                                            </span>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                } @else {
                    <div class="p-4 text-center text-muted">
                        No paychecks found for this employee.
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
export class ChecksComponent {
    @Input() employeeName: string = '';
    @Input() checks: CheckRecord[] = [];

    @Output() checkClicked = new EventEmitter<CheckRecord>();

    onRowClick(check: CheckRecord): void {
        this.checkClicked.emit(check);
    }

    hasEmployeeNames(): boolean {
        return this.checks.some(c => !!c.employeeName);
    }
}

