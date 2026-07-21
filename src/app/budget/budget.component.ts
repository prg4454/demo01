import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-budget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './budget.component.html',
    styleUrl: './budget.component.scss'
})
export class BudgetComponent { }