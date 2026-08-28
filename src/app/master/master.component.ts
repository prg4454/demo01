import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmployeesComponent, Employee } from './employees.component';
import { ChecksComponent, CheckRecord } from './checks.component';
import { HoursComponent, HoursRecord } from './hours.component';
import { CompaniesComponent } from './companies.component';
import { BreadcrumbsComponent } from './breadcrumbs.component';

export interface NavigationRoute {
    label: string;
    path: string;
}

export interface MockCompany {
    id: string;
    name: string;
    industry: string;
    employees: number;
    hq: string;
}

@Component({
    selector: 'app-master',
    standalone: true,
    imports: [CommonModule, NgbDropdownModule, EmployeesComponent, ChecksComponent, HoursComponent, CompaniesComponent, BreadcrumbsComponent],
    templateUrl: './master.component.html',
    styleUrl: './master.component.scss'
})
export class MasterComponent {
    private router = inject(Router);
    private modalService = inject(NgbModal);

    activeTab: 'companies' | 'employees' | 'checks' | 'hours' = 'companies';
    isCompanyListVisible = true;

    selectedCompany: MockCompany | null = null;
    selectedCompanyEmployees: Employee[] = [];
    selectedEmployee: Employee | null = null;
    selectedCheck: CheckRecord | null = null;

    selectedEmployeeChecks: CheckRecord[] = [];
    selectedEmployeeHours: HoursRecord[] = [];

    navigationRoutes: NavigationRoute[] = [
        { label: 'Companies', path: 'companies' },
        { label: 'Employees', path: 'employees' },
        { label: 'Checks', path: 'checks' },
        { label: 'Hours', path: 'hours' }
    ];

    companies: MockCompany[] = [
        { id: 'C001', name: 'Acme Corporation', industry: 'Manufacturing', employees: 1250, hq: 'Chicago, IL' },
        { id: 'C002', name: 'Globex Corporation', industry: 'Technology', employees: 4200, hq: 'Seattle, WA' },
        { id: 'C003', name: 'Initech Software', industry: 'Software Services', employees: 180, hq: 'Austin, TX' },
        { id: 'C004', name: 'Umbrella Corporation', industry: 'Biotechnology', employees: 8500, hq: 'Raccoon City, MO' },
        { id: 'C005', name: 'Hooli Inc.', industry: 'Internet Technology', employees: 12000, hq: 'Mountain View, CA' },
        { id: 'C006', name: 'Soylent Industries', industry: 'Food Production', employees: 3400, hq: 'New York, NY' },
        { id: 'C007', name: 'Virtucon', industry: 'Conglomerate', employees: 950, hq: 'London, UK' }
    ];

    private companyEmployeesMap: Record<string, Employee[]> = {
        'C001': [
            { id: 'E001', name: 'John Doe', role: 'Plant Manager', email: 'john.doe@acme.com' },
            { id: 'E002', name: 'Jane Smith', role: 'QA Inspector', email: 'jane.smith@acme.com' }
        ],
        'C002': [
            { id: 'E003', name: 'Hank Scorpio', role: 'CEO & Founder', email: 'hank@globex.com' },
            { id: 'E004', name: 'Homer Simpson', role: 'Nuclear Technician', email: 'homer@globex.com' }
        ],
        'C003': [
            { id: 'E005', name: 'Peter Gibbons', role: 'Software Engineer', email: 'peter@initech.com' },
            { id: 'E006', name: 'Milton Waddams', role: 'Collator', email: 'stapler@initech.com' }
        ],
        'C004': [
            { id: 'E007', name: 'Albert Wesker', role: 'Lead Researcher', email: 'wesker@umbrella.com' },
            { id: 'E008', name: 'Ada Wong', role: 'Security Consultant', email: 'ada@umbrella.com' }
        ],
        'C005': [
            { id: 'E009', name: 'Gavin Belson', role: 'CEO', email: 'gavin@hooli.com' },
            { id: 'E010', name: 'Richard Hendricks', role: 'Developer', email: 'richard@hooli.com' }
        ],
        'C006': [
            { id: 'E011', name: 'Robert Thorn', role: 'Director', email: 'thorn@soylent.com' }
        ],
        'C007': [
            { id: 'E012', name: 'Dr. Evil', role: 'President', email: 'evil@virtucon.com' }
        ]
    };

    private employeeChecksMap: Record<string, CheckRecord[]> = {
        'E001': [
            { checkNumber: 'CH-1001', date: '2026-08-01', amount: 2850.00, status: 'Cleared' },
            { checkNumber: 'CH-1002', date: '2026-08-15', amount: 2950.00, status: 'Cleared' }
        ],
        'E002': [
            { checkNumber: 'CH-1003', date: '2026-08-01', amount: 1950.00, status: 'Cleared' },
            { checkNumber: 'CH-1004', date: '2026-08-15', amount: 1950.00, status: 'Cleared' }
        ],
        'E003': [
            { checkNumber: 'CH-2001', date: '2026-08-01', amount: 25000.00, status: 'Cleared' },
            { checkNumber: 'CH-2002', date: '2026-08-15', amount: 25000.00, status: 'Cleared' }
        ],
        'E004': [
            { checkNumber: 'CH-2003', date: '2026-08-01', amount: 1250.75, status: 'Cleared' },
            { checkNumber: 'CH-2004', date: '2026-08-15', amount: 1420.50, status: 'Cleared' }
        ],
        'E005': [
            { checkNumber: 'CH-3001', date: '2026-08-01', amount: 3200.00, status: 'Cleared' },
            { checkNumber: 'CH-3002', date: '2026-08-15', amount: 3200.00, status: 'Cleared' }
        ],
        'E006': [
            { checkNumber: 'CH-3003', date: '2026-08-01', amount: 850.00, status: 'Cleared' },
            { checkNumber: 'CH-3004', date: '2026-08-15', amount: 920.00, status: 'Cleared' }
        ],
        'E007': [
            { checkNumber: 'CH-4001', date: '2026-08-01', amount: 8500.00, status: 'Cleared' },
            { checkNumber: 'CH-4002', date: '2026-08-15', amount: 8500.00, status: 'Cleared' }
        ],
        'E008': [
            { checkNumber: 'CH-4003', date: '2026-08-01', amount: 6200.00, status: 'Cleared' },
            { checkNumber: 'CH-4004', date: '2026-08-15', amount: 6200.00, status: 'Cleared' }
        ],
        'E009': [
            { checkNumber: 'CH-5001', date: '2026-08-01', amount: 50000.00, status: 'Cleared' },
            { checkNumber: 'CH-5002', date: '2026-08-15', amount: 50000.00, status: 'Cleared' }
        ],
        'E010': [
            { checkNumber: 'CH-5003', date: '2026-08-01', amount: 4800.00, status: 'Cleared' },
            { checkNumber: 'CH-5004', date: '2026-08-15', amount: 4800.00, status: 'Cleared' }
        ],
        'E011': [
            { checkNumber: 'CH-6001', date: '2026-08-01', amount: 3100.00, status: 'Cleared' },
            { checkNumber: 'CH-6002', date: '2026-08-15', amount: 3100.00, status: 'Cleared' }
        ],
        'E012': [
            { checkNumber: 'CH-7001', date: '2026-08-01', amount: 1000000.00, status: 'Cleared' },
            { checkNumber: 'CH-7002', date: '2026-08-15', amount: 1000000.00, status: 'Cleared' }
        ]
    };

    private employeeHoursMap: Record<string, HoursRecord[]> = {
        'E001': [
            { weekEnding: '2026-07-27', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-1001' },
            { weekEnding: '2026-08-10', regularHours: 40, overtimeHours: 4, totalHours: 44, checkNumber: 'CH-1002' }
        ],
        'E002': [
            { weekEnding: '2026-07-27', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-1003' },
            { weekEnding: '2026-08-10', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-1004' }
        ],
        'E003': [
            { weekEnding: '2026-07-27', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-2001' },
            { weekEnding: '2026-08-10', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-2002' }
        ],
        'E004': [
            { weekEnding: '2026-07-27', regularHours: 35, overtimeHours: 2, totalHours: 37, checkNumber: 'CH-2003' },
            { weekEnding: '2026-08-10', regularHours: 40, overtimeHours: 12, totalHours: 52, checkNumber: 'CH-2004' }
        ],
        'E005': [
            { weekEnding: '2026-07-27', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-3001' },
            { weekEnding: '2026-08-10', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-3002' }
        ],
        'E006': [
            { weekEnding: '2026-07-27', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-3003' },
            { weekEnding: '2026-08-10', regularHours: 40, overtimeHours: 8, totalHours: 48, checkNumber: 'CH-3004' }
        ],
        'E007': [
            { weekEnding: '2026-07-27', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-4001' },
            { weekEnding: '2026-08-10', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-4002' }
        ],
        'E008': [
            { weekEnding: '2026-07-27', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-4003' },
            { weekEnding: '2026-08-10', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-4004' }
        ],
        'E009': [
            { weekEnding: '2026-07-27', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-5001' },
            { weekEnding: '2026-08-10', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-5002' }
        ],
        'E010': [
            { weekEnding: '2026-07-27', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-5003' },
            { weekEnding: '2026-08-10', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-5004' }
        ],
        'E011': [
            { weekEnding: '2026-07-27', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-6001' },
            { weekEnding: '2026-08-10', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-6002' }
        ],
        'E012': [
            { weekEnding: '2026-07-27', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-7001' },
            { weekEnding: '2026-08-10', regularHours: 40, overtimeHours: 0, totalHours: 40, checkNumber: 'CH-7002' }
        ]
    };

    navigateTo(path: string): void {
        if (['companies', 'employees', 'checks', 'hours'].includes(path)) {
            this.selectTab(path as 'companies' | 'employees' | 'checks' | 'hours');
        }
    }

    selectTab(tab: 'companies' | 'employees' | 'checks' | 'hours'): void {
        this.activeTab = tab;
        this.isCompanyListVisible = (tab === 'companies');
    }

    @HostListener('window:popstate')
    onPopState() {
        this.modalService.dismissAll();
    }

    onCompanyClick(company: MockCompany, confirmModal: any): void {
        this.selectedCompany = company;
        this.selectedEmployee = null;
        this.selectedCheck = null;

        const state = { ...history.state, masterModalOpen: true };
        history.pushState(state, '', window.location.href);

        this.modalService.open(confirmModal, { centered: true }).result.then(
            (result) => {
                if (history.state?.masterModalOpen) { history.back(); }
                if (result === 'view-employees') {
                    this.selectedCompanyEmployees = this.companyEmployeesMap[company.id] || [];
                    this.selectTab('employees');
                } else if (result === 'view-checks') {
                    const employees = this.companyEmployeesMap[company.id] || [];
                    const allChecks: CheckRecord[] = [];
                    employees.forEach(emp => {
                        const checks = this.getOrCreateEmployeeChecks(emp);
                        const checksWithEmpName = checks.map(c => ({
                            ...c,
                            employeeName: emp.name
                        }));
                        allChecks.push(...checksWithEmpName);
                    });
                    this.selectedEmployeeChecks = allChecks;
                    this.selectTab('checks');
                }
            },
            () => {
                if (history.state?.masterModalOpen) { history.back(); }
            }
        );
    }

    onEmployeeClicked(employee: Employee, actionModal: any, infoModal: any): void {
        this.selectedEmployee = employee;
        this.selectedCheck = null;

        const state = { ...history.state, masterModalOpen: true };
        history.pushState(state, '', window.location.href);

        this.modalService.open(actionModal, { centered: true }).result.then(
            (action) => {
                if (history.state?.masterModalOpen) { history.back(); }
                if (action === 'checks') {
                    this.selectedEmployeeChecks = this.getOrCreateEmployeeChecks(employee);
                    this.selectTab('checks');
                } else if (action === 'hours') {
                    this.selectedEmployeeHours = this.getOrCreateEmployeeHours(employee);
                    this.selectTab('hours');
                } else if (action === 'info') {
                    const infoState = { ...history.state, masterModalOpen: true };
                    history.pushState(infoState, '', window.location.href);

                    this.modalService.open(infoModal, { centered: true }).result.then(
                        () => { if (history.state?.masterModalOpen) { history.back(); } },
                        () => { if (history.state?.masterModalOpen) { history.back(); } }
                    );
                }
            },
            () => {
                if (history.state?.masterModalOpen) { history.back(); }
            }
        );
    }

    onCheckClicked(check: CheckRecord): void {
        this.selectedCheck = check;
        if (this.selectedEmployee) {
            // Filter hours down to a single mock item to represent a filtered paycheck period
            this.selectedEmployeeHours = this.getOrCreateEmployeeHours(this.selectedEmployee).slice(0, 1);
        }
        this.selectTab('hours');
    }

    clearCheckFilter(): void {
        this.selectedCheck = null;
        if (this.selectedEmployee) {
            this.selectedEmployeeHours = this.getOrCreateEmployeeHours(this.selectedEmployee);
        }
    }

    private getOrCreateEmployeeChecks(employee: Employee): CheckRecord[] {
        if (this.employeeChecksMap[employee.id]) {
            return this.employeeChecksMap[employee.id];
        }
        return [
            { checkNumber: 'CH-' + Math.floor(1000 + Math.random() * 9000), date: '2026-08-01', amount: 2000 + Math.random() * 1500, status: 'Cleared' },
            { checkNumber: 'CH-' + Math.floor(1000 + Math.random() * 9000), date: '2026-08-15', amount: 2000 + Math.random() * 1500, status: 'Cleared' }
        ];
    }

    private getOrCreateEmployeeHours(employee: Employee): HoursRecord[] {
        if (this.employeeHoursMap[employee.id]) {
            return this.employeeHoursMap[employee.id];
        }
        const checks = this.getOrCreateEmployeeChecks(employee);

        // Map hours logs directly from generated parent check records
        return checks.map((check, index) => {
            const checkDate = new Date(check.date);
            const weekEndingDate = new Date(checkDate);
            weekEndingDate.setDate(weekEndingDate.getDate() - 5);
            const weekEndingStr = weekEndingDate.toISOString().split('T')[0];

            const regularHours = 40;
            const overtimeHours = index === 0 ? 4 : 0; // Mock overtime on first week

            return {
                weekEnding: weekEndingStr,
                regularHours,
                overtimeHours,
                totalHours: regularHours + overtimeHours,
                checkNumber: check.checkNumber
            };
        });
    }
}
