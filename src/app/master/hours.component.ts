import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HoursRecord {
    weekEnding: string;
    regularHours: number;
    overtimeHours: number;
    totalHours: number;
    checkNumber?: string;
}

@Component({
    selector: 'app-hours',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="card shadow-sm mb-4">
            <div class="card-header bg-light">
                <h5 class="mb-0">Timecard Hours for {{ employeeName }}</h5>
            </div>
            <div class="card-body p-0">
                @if (hoursLogs.length > 0) {
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th scope="col" class="ps-3">Week Ending</th>
                                    <th scope="col">Regular Hours</th>
                                    <th scope="col">Overtime Hours</th>
                                    <th scope="col">Total Hours</th>
                                    <th scope="col" class="pe-3">Check #</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (log of hoursLogs; track log.weekEnding) {
                                    <tr>
                                        <td class="fw-semibold ps-3">{{ log.weekEnding }}</td>
                                        <td>{{ log.regularHours }}</td>
                                        <td>{{ log.overtimeHours }}</td>
                                        <td class="fw-medium">{{ log.totalHours }}</td>
                                        <td class="pe-3">
                                            @if (log.checkNumber) {
                                                <span class="badge bg-secondary text-white">{{ log.checkNumber }}</span>
                                            } @else {
                                                <span class="text-muted small">N/A</span>
                                            }
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                } @else {
                    <div class="p-4 text-center text-muted">
                        No timecard records found for this employee.
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
export class HoursComponent {
    @Input() employeeName: string = '';
    @Input() hoursLogs: HoursRecord[] = [];
}

