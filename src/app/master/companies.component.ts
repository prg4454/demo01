import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockCompany } from './master.component';

@Component({
    selector: 'app-companies',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="card shadow-sm mb-4">
            <div class="card-header bg-light">
                <h5 class="mb-0">Mock Company Registry</h5>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th scope="col" class="ps-3">ID</th>
                                <th scope="col">Company Name</th>
                                <th scope="col">Industry</th>
                                <th scope="col">Employees</th>
                                <th scope="col" class="pe-3">Headquarters</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (company of companies; track company.id) {
                                <tr (click)="onRowClick(company)" style="cursor: pointer;">
                                    <td class="fw-semibold ps-3">{{ company.id }}</td>
                                    <td class="text-primary fw-medium">{{ company.name }}</td>
                                    <td>
                                        <span class="badge bg-secondary text-white">
                                            {{ company.industry }}
                                        </span>
                                    </td>
                                    <td>{{ company.employees }}</td>
                                    <td class="text-muted pe-3">{{ company.hq }}</td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
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
export class CompaniesComponent {
    @Input() companies: MockCompany[] = [];
    @Output() companyClicked = new EventEmitter<MockCompany>();

    onRowClick(company: MockCompany): void {
        this.companyClicked.emit(company);
    }
}

