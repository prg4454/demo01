import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ExportDropdownComponent } from '../export-dropdown/export-dropdown.component';
import { ModalHistoryService } from '../modal-history.service';
import { StorageService } from '../storage.service';
import { TodoCategory, TodoPriority, TodoRecord, TodoStatus, TodosModalResult } from './todo.model';
import { TodosEntryModalComponent } from './todos-entry-modal.component';

export type { TodoCategory, TodoPriority, TodoRecord, TodoStatus, TodosModalResult };

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModalModule, ExportDropdownComponent],
  templateUrl: './todos.component.html',
  styleUrl: './todos.component.scss'
})
export class TodosComponent implements OnInit {
  private modalService = inject(NgbModal);
  private modalHistory = inject(ModalHistoryService);
  private storageService = inject(StorageService);

  readonly pageSize = 8;
  currentPage = 1;
  exportMessage = '';
  isLoading = false;

  searchQuery = '';
  selectedCategory = 'All';
  selectedStatus = 'All';
  selectedAssignee = 'All';
  sortBy: 'title' | 'priority' | 'dueDate' | 'status' | 'assignedTo' = 'dueDate';
  sortAsc = true;

  readonly categories: TodoCategory[] = ['Work', 'Personal', 'Finance', 'Health', 'Home', 'Development', 'General'];
  readonly priorities: TodoPriority[] = ['Low', 'Medium', 'High', 'Critical'];
  readonly statuses: TodoStatus[] = ['Pending', 'In Progress', 'Completed', 'Deferred'];

  todos: TodoRecord[] = [];

  readonly initialSeedTodos: TodoRecord[] = [
    {
      id: 201,
      title: 'Q3 Financial Forecast and Budget Allocation',
      category: 'Finance',
      priority: 'Critical',
      status: 'In Progress',
      dueDate: '2026-09-02',
      assignedTo: 'Sarah Chen',
      comments: 'Review department expense sheets and adjust marketing spend.'
    },
    {
      id: 202,
      title: 'Implement OAuth2 PKCE Flow in Auth Module',
      category: 'Development',
      priority: 'High',
      status: 'In Progress',
      dueDate: '2026-09-05',
      assignedTo: 'Alex Rivera',
      comments: 'Follow latest IETF recommendations for single-page apps.'
    },
    {
      id: 203,
      title: 'Annual Health Checkup & Lab Work',
      category: 'Health',
      priority: 'Medium',
      status: 'Pending',
      dueDate: '2026-09-10',
      assignedTo: 'Self',
      comments: 'Fasting required from midnight before appointment.'
    },
    {
      id: 204,
      title: 'HVAC Air Filter Replacement and Duct Inspection',
      category: 'Home',
      priority: 'Low',
      status: 'Completed',
      dueDate: '2026-08-25',
      assignedTo: 'David Miller',
      comments: 'Replaced with MERV 13 filters throughout the house.'
    },
    {
      id: 205,
      title: 'Prepare Product Demo Deck for Global Summit',
      category: 'Work',
      priority: 'Critical',
      status: 'In Progress',
      dueDate: '2026-09-01',
      assignedTo: 'Elena Rostova',
      comments: 'Include interactive generative UI widgets and metrics.'
    },
    {
      id: 206,
      title: 'Renew Vehicle Registration & Insurance Policy',
      category: 'Personal',
      priority: 'High',
      status: 'Pending',
      dueDate: '2026-09-08',
      assignedTo: 'Self',
      comments: 'Compare umbrella liability rates before renewal.'
    },
    {
      id: 207,
      title: 'Optimize Database Indexing on Orders Table',
      category: 'Development',
      priority: 'High',
      status: 'Pending',
      dueDate: '2026-09-12',
      assignedTo: 'Marcus Vance',
      comments: 'Analyze slow query logs for compound indexes.'
    },
    {
      id: 208,
      title: 'Weekly Grocery Stockup & Meal Prep',
      category: 'Home',
      priority: 'Low',
      status: 'Completed',
      dueDate: '2026-08-27',
      assignedTo: 'Self',
      comments: 'Organic vegetables, salmon, and Greek yogurt.'
    },
    {
      id: 209,
      title: 'Quarterly Security Audit & Dependency Scans',
      category: 'Development',
      priority: 'Critical',
      status: 'Pending',
      dueDate: '2026-09-15',
      assignedTo: 'Security Team',
      comments: 'Run Snyk and npm audit with zero high-severity CVEs allowed.'
    },
    {
      id: 210,
      title: 'Dental Cleaning & Checkup',
      category: 'Health',
      priority: 'Medium',
      status: 'Pending',
      dueDate: '2026-09-18',
      assignedTo: 'Self',
      comments: 'Appointment booked with Dr. Patel at 10:00 AM.'
    },
    {
      id: 211,
      title: 'Review Cloud Infrastructure Invoices & Reserved Instances',
      category: 'Finance',
      priority: 'Medium',
      status: 'Deferred',
      dueDate: '2026-09-25',
      assignedTo: 'DevOps Lead',
      comments: 'Evaluate 1-year vs 3-year savings plans.'
    },
    {
      id: 212,
      title: 'Organize Home Office Workspace & Cable Management',
      category: 'Home',
      priority: 'Low',
      status: 'Completed',
      dueDate: '2026-08-20',
      assignedTo: 'Self',
      comments: 'Installed under-desk tray and ergonomic monitor arm.'
    }
  ];

  async ngOnInit(): Promise<void> {
    await this.loadDataFromStorage();
  }

  private async loadDataFromStorage(): Promise<void> {
    try {
      this.isLoading = true;
      const count = await this.storageService.getCount('todos');
      if (count === 0) {
        await this.storageService.saveAll('todos', this.initialSeedTodos);
      }

      this.todos = await this.storageService.getAll<TodoRecord>('todos');
    } catch (err) {
      console.error('Failed to load to-dos from IndexedDB storage:', err);
      // Fallback in-memory if IndexedDB unavailable
      if (!this.todos.length) {
        this.todos = [...this.initialSeedTodos];
      }
    } finally {
      this.isLoading = false;
    }
  }

  get assignees(): string[] {
    const list = Array.from(new Set(this.todos.map(t => t.assignedTo).filter(Boolean)));
    return list.sort();
  }

  get totalTodos(): number {
    return this.filteredTodos.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTodos.length / this.pageSize));
  }

  get filteredTodos(): TodoRecord[] {
    let result = [...this.todos];

    if (this.selectedCategory !== 'All') {
      result = result.filter(t => t.category === this.selectedCategory);
    }

    if (this.selectedStatus !== 'All') {
      result = result.filter(t => t.status === this.selectedStatus);
    }

    if (this.selectedAssignee !== 'All') {
      result = result.filter(t => t.assignedTo === this.selectedAssignee);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.assignedTo.toLowerCase().includes(q) ||
        t.comments.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    const priorityWeights: Record<TodoPriority, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1
    };

    return result.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (this.sortBy === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else if (this.sortBy === 'priority') {
        valA = priorityWeights[a.priority] ?? 0;
        valB = priorityWeights[b.priority] ?? 0;
      } else if (this.sortBy === 'dueDate') {
        valA = a.dueDate;
        valB = b.dueDate;
      } else if (this.sortBy === 'status') {
        valA = a.status;
        valB = b.status;
      } else if (this.sortBy === 'assignedTo') {
        valA = a.assignedTo.toLowerCase();
        valB = b.assignedTo.toLowerCase();
      }

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });
  }

  get pagedTodos(): TodoRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTodos.slice(start, start + this.pageSize);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  toggleSort(field: 'title' | 'priority' | 'dueDate' | 'status' | 'assignedTo'): void {
    if (this.sortBy === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortBy = field;
      this.sortAsc = true;
    }
    this.currentPage = 1;
  }

  async toggleComplete(todo: TodoRecord): Promise<void> {
    todo.status = todo.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await this.storageService.save('todos', todo);
    } catch (err) {
      console.error('Failed to save to-do completion to IndexedDB:', err);
    }
  }

  openAddModal(): void {
  async openAddModal(): Promise<void> {
    const { TodosEntryModalComponent } = await import('./todos-entry-modal.component');
    const nextId = this.todos.length > 0 ? Math.max(...this.todos.map(t => t.id)) + 1 : 201;
    const newTodo: TodoRecord = {
      id: nextId,
      title: '',
      category: 'Work',
      priority: 'Medium',
      status: 'Pending',
      dueDate: new Date().toISOString().slice(0, 10),
      assignedTo: '',
      comments: ''
    };

    const modalRef = this.modalService.open(TodosEntryModalComponent, {
      centered: true,
      size: 'lg',
      backdrop: true,
      keyboard: true,
      scrollable: true,
      beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
    });

    modalRef.componentInstance.todo = newTodo;
    modalRef.componentInstance.allowDelete = false;
    this.modalHistory.registerModal(modalRef);

    modalRef.result
      .then(async (res: TodosModalResult) => {
        if (res?.action === 'save' && res.todo) {
          try {
            await this.storageService.save('todos', res.todo);
          } catch (err) {
            console.error('Failed to save new to-do in IndexedDB:', err);
          }
          this.todos = [res.todo, ...this.todos];
          this.currentPage = 1;
        }
      })
      .catch(() => { });
  }

  openEditModal(todo: TodoRecord): void {
  async openEditModal(todo: TodoRecord): Promise<void> {
    const { TodosEntryModalComponent } = await import('./todos-entry-modal.component');
    const modalRef = this.modalService.open(TodosEntryModalComponent, {
      centered: true,
      size: 'lg',
      backdrop: true,
      keyboard: true,
      scrollable: true,
      beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
    });

    modalRef.componentInstance.todo = structuredClone(todo);
    modalRef.componentInstance.allowDelete = true;
    this.modalHistory.registerModal(modalRef);

    modalRef.result
      .then(async (res: TodosModalResult) => {
        if (!res) return;

        if (res.action === 'save' && res.todo) {
          try {
            await this.storageService.save('todos', res.todo);
          } catch (err) {
            console.error('Failed to update to-do in IndexedDB:', err);
          }
          const index = this.todos.findIndex(t => t.id === res.todo.id);
          if (index !== -1) {
            this.todos[index] = res.todo;
          }
        } else if (res.action === 'delete') {
          try {
            await this.storageService.delete('todos', res.todo.id);
          } catch (err) {
            console.error('Failed to delete to-do from IndexedDB:', err);
          }
          this.todos = this.todos.filter(t => t.id !== res.todo.id);
          if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
          }
        }
      })
      .catch(() => { });
  }

  openInfo(content: TemplateRef<any>): void {
    const modalRef = this.modalService.open(content, {
      centered: true,
      size: 'lg',
      backdrop: true,
      keyboard: true,
      beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
    });
    this.modalHistory.registerModal(modalRef);
  }
}
