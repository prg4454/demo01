import { Component, inject, HostListener, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmployeesComponent, Employee } from './employees.component';
import { ChecksComponent, CheckRecord } from './checks.component';
import { HoursComponent, HoursRecord } from './hours.component';
import { CompaniesComponent } from './companies.component';
import { BreadcrumbsComponent } from './breadcrumbs.component';
import { CompanyActionsModalComponent } from './company-actions-modal.component';

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

export interface CompanyPayrollStats {
    totalSpend: number;
    avgCheck: number;
    totalChecks: number;
    employeeCount: number;
    breakdown: {
        employeeId: string;
        name: string;
        role: string;
        checksCount: number;
        totalPaid: number;
    }[];
}

@Component({
    selector: 'app-master',
    standalone: true,
    imports: [CommonModule, FormsModule, NgbDropdownModule, EmployeesComponent, ChecksComponent, HoursComponent, CompaniesComponent, BreadcrumbsComponent],
    templateUrl: './master.component.html',
    styleUrl: './master.component.scss'
})
export class MasterComponent {
    private router = inject(Router);
    private modalService = inject(NgbModal);

    @ViewChild('companyProfileModal') companyProfileModal!: TemplateRef<any>;
    @ViewChild('payrollSummaryModal') payrollSummaryModal!: TemplateRef<any>;
    @ViewChild('addEmployeeModal') addEmployeeModal!: TemplateRef<any>;
    @ViewChild('companySettingsModal') companySettingsModal!: TemplateRef<any>;

    notificationMessage: string | null = null;
    private notificationTimer: any = null;

    newEmployee = { name: '', role: '', email: '' };

    companyPayrollStats: CompanyPayrollStats = {
        totalSpend: 0,
        avgCheck: 0,
        totalChecks: 0,
        employeeCount: 0,
        breakdown: []
    };

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
            { id: 'E001', name: 'John Doe', role: 'Plant Manager', email: 'john.doe@acme.com', status: 'Active' },
            { id: 'E002', name: 'Jane Smith', role: 'QA Inspector', email: 'jane.smith@acme.com', status: 'On Leave' }
        ],
        'C002': [
            { id: 'E003', name: 'Hank Scorpio', role: 'CEO & Founder', email: 'hank@globex.com', status: 'Active' },
            { id: 'E004', name: 'Homer Simpson', role: 'Nuclear Technician', email: 'homer@globex.com', status: 'On Leave' }
        ],
        'C003': [
            { id: 'E005', name: 'Peter Gibbons', role: 'Software Engineer', email: 'peter@initech.com', status: 'Active' },
            { id: 'E006', name: 'Milton Waddams', role: 'Collator', email: 'stapler@initech.com', status: 'Terminated' }
        ],
        'C004': [
            { id: 'E007', name: 'Albert Wesker', role: 'Lead Researcher', email: 'wesker@umbrella.com', status: 'Terminated' },
            { id: 'E008', name: 'Ada Wong', role: 'Security Consultant', email: 'ada@umbrella.com', status: 'Active' }
        ],
        'C005': [
            { id: 'E009', name: 'Gavin Belson', role: 'CEO', email: 'gavin@hooli.com', status: 'Active' },
            { id: 'E010', name: 'Richard Hendricks', role: 'Developer', email: 'richard@hooli.com', status: 'On Leave' }
        ],
        'C006': [
            { id: 'E011', name: 'Robert Thorn', role: 'Director', email: 'thorn@soylent.com', status: 'Active' }
        ],
        'C007': [
            { id: 'E012', name: 'Dr. Evil', role: 'President', email: 'evil@virtucon.com', status: 'Active' }
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
        if (tab === 'employees' && this.selectedCompany) {
            this.selectedCompanyEmployees = this.companyEmployeesMap[this.selectedCompany.id] || [];
        }
    }

    @HostListener('window:popstate')
    onPopState() {
        this.modalService.dismissAll();
    }

    showNotification(message: string): void {
        this.notificationMessage = message;
        if (this.notificationTimer) {
            clearTimeout(this.notificationTimer);
        }
        this.notificationTimer = setTimeout(() => {
            this.notificationMessage = null;
        }, 5000);
    }

    onCompanyClick(company: MockCompany): void {
        this.selectedCompany = company;
        this.selectedEmployee = null;
        this.selectedCheck = null;

        const state = { ...history.state, masterModalOpen: true };
        history.pushState(state, '', window.location.href);

        const modalRef = this.modalService.open(CompanyActionsModalComponent, {
            modalDialogClass: 'modal-90w',
            windowClass: 'modal-90w',
            centered: true,
            scrollable: true
        });
        modalRef.componentInstance.company = company;

        modalRef.result.then(
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
                } else if (result === 'view-hours') {
                    const employees = this.companyEmployeesMap[company.id] || [];
                    const allHours: HoursRecord[] = [];
                    employees.forEach(emp => {
                        const hours = this.getOrCreateEmployeeHours(emp);
                        allHours.push(...hours);
                    });
                    this.selectedEmployeeHours = allHours;
                    this.selectedEmployee = { id: company.id, name: `${company.name} (All Staff)`, role: company.industry, email: '' };
                    this.selectTab('hours');
                } else if (result === 'company-profile') {
                    this.openSubModal(this.companyProfileModal);
                } else if (result === 'payroll-summary') {
                    this.calculatePayrollSummary(company);
                    const modalRef = this.modalService.open(this.payrollSummaryModal, { size: 'lg', centered: true, scrollable: true });
                    const summaryState = { ...history.state, masterModalOpen: true };
                    history.pushState(summaryState, '', window.location.href);

                    modalRef.result.then(
                        (subResult) => {
                            if (history.state?.masterModalOpen) { history.back(); }
                            if (subResult === 'export') {
                                this.exportCompanyData(company);
                            }
                        },
                        () => {
                            if (history.state?.masterModalOpen) { history.back(); }
                        }
                    );
                } else if (result === 'export-data') {
                    this.exportCompanyData(company);
                } else if (result === 'add-employee') {
                    this.newEmployee = { name: '', role: '', email: '' };
                    this.openSubModal(this.addEmployeeModal);
                } else if (result === 'company-settings') {
                    this.openSubModal(this.companySettingsModal);
                }
            },
            () => {
                if (history.state?.masterModalOpen) { history.back(); }
            }
        );
    }

    private openSubModal(modalTemplate: TemplateRef<any>, options: any = { centered: true, scrollable: true }): void {
        if (!modalTemplate) return;
        const state = { ...history.state, masterModalOpen: true };
        history.pushState(state, '', window.location.href);
        this.modalService.open(modalTemplate, { centered: true, scrollable: true, ...options }).result.then(
            () => { if (history.state?.masterModalOpen) { history.back(); } },
            () => { if (history.state?.masterModalOpen) { history.back(); } }
        );
    }

    calculatePayrollSummary(company: MockCompany): void {
        const employees = this.companyEmployeesMap[company.id] || [];
        let totalSpend = 0;
        let totalChecks = 0;
        const breakdown = employees.map(emp => {
            const checks = this.getOrCreateEmployeeChecks(emp);
            const totalPaid = checks.reduce((sum, c) => sum + c.amount, 0);
            totalSpend += totalPaid;
            totalChecks += checks.length;
            return {
                employeeId: emp.id,
                name: emp.name,
                role: emp.role,
                checksCount: checks.length,
                totalPaid
            };
        });

        this.companyPayrollStats = {
            totalSpend,
            avgCheck: totalChecks > 0 ? Math.round((totalSpend / totalChecks) * 100) / 100 : 0,
            totalChecks,
            employeeCount: employees.length,
            breakdown
        };
    }

    exportCompanyData(company: MockCompany): void {
        const employees = this.companyEmployeesMap[company.id] || [];
        let csv = `Company ID,Company Name,Industry,Headquarters,Headcount\r\n`;
        csv += `${company.id},"${company.name}","${company.industry}","${company.hq}",${company.employees}\r\n\r\n`;
        csv += `Employee ID,Name,Role,Email,Checks Count,Total Paid (USD)\r\n`;

        employees.forEach(emp => {
            const checks = this.getOrCreateEmployeeChecks(emp);
            const totalPaid = checks.reduce((sum, c) => sum + c.amount, 0);
            csv += `${emp.id},"${emp.name}","${emp.role}","${emp.email}",${checks.length},${totalPaid.toFixed(2)}\r\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${company.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_payroll_export.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showNotification(`Successfully exported payroll and employee data for ${company.name}`);
    }

    saveNewEmployee(modal: any): void {
        if (!this.selectedCompany || !this.newEmployee.name || !this.newEmployee.role) return;
        const newId = 'E' + String(Math.floor(100 + Math.random() * 900));
        const createdEmp: Employee = {
            id: newId,
            name: this.newEmployee.name,
            role: this.newEmployee.role,
            email: this.newEmployee.email || `${this.newEmployee.name.toLowerCase().replace(/\s+/g, '.')}@example.com`
        };

        if (!this.companyEmployeesMap[this.selectedCompany.id]) {
            this.companyEmployeesMap[this.selectedCompany.id] = [];
        }
        this.companyEmployeesMap[this.selectedCompany.id].push(createdEmp);
        this.selectedCompany.employees++;
        this.selectedCompanyEmployees = this.companyEmployeesMap[this.selectedCompany.id];

        modal.close();
        this.selectTab('employees');
        this.showNotification(`Added new employee ${createdEmp.name} to ${this.selectedCompany.name}`);
    }

    saveSettings(modal: any): void {
        modal.close();
        this.showNotification(`Company settings saved for ${this.selectedCompany?.name}`);
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
