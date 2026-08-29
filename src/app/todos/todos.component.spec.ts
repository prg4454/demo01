import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TodosComponent } from './todos.component';
import { ModalHistoryService } from '../modal-history.service';
import { StorageService } from '../storage.service';
import { TodoRecord } from './todo.model';

describe('TodosComponent', () => {
  let component: TodosComponent;
  let fixture: ComponentFixture<TodosComponent>;

  const mockStorageService = {
    getCount: jasmine.createSpy('getCount').and.returnValue(Promise.resolve(1)),
    getAll: jasmine.createSpy('getAll').and.returnValue(
      Promise.resolve<TodoRecord[]>([
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
        }
      ])
    ),
    saveAll: jasmine.createSpy('saveAll').and.returnValue(Promise.resolve()),
    save: jasmine.createSpy('save').and.returnValue(Promise.resolve()),
    delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ModalHistoryService,
        { provide: StorageService, useValue: mockStorageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TodosComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  it('should create the component and load items from storage', () => {
    expect(component).toBeTruthy();
    expect(component.todos.length).toBe(4);
    expect(mockStorageService.getAll).toHaveBeenCalledWith('todos');
  });

  it('should paginate items properly', () => {
    expect(component.pageSize).toBe(8);
    expect(component.currentPage).toBe(1);
    expect(component.pagedTodos.length).toBe(4);
  });

  it('should filter by search query', () => {
    component.searchQuery = 'OAuth2';
    const matches = component.filteredTodos;
    expect(matches.length).toBe(1);
    expect(matches[0].title).toContain('OAuth2');
  });

  it('should filter by category', () => {
    component.selectedCategory = 'Development';
    const devTasks = component.filteredTodos;
    expect(devTasks.length).toBe(1);
    expect(devTasks[0].category).toBe('Development');
  });

  it('should filter by status', () => {
    component.selectedStatus = 'Completed';
    const completedTasks = component.filteredTodos;
    expect(completedTasks.length).toBe(1);
    expect(completedTasks[0].status).toBe('Completed');
  });

  it('should toggle completion status and persist to storage', async () => {
    const task = component.todos[0];
    expect(task.status).toBe('In Progress');
    await component.toggleComplete(task);
    expect(task.status).toBe('Completed');
    expect(mockStorageService.save).toHaveBeenCalledWith('todos', task);
  });

  it('should sort by priority', () => {
    component.selectedCategory = 'All';
    component.selectedStatus = 'All';
    component.searchQuery = '';
    component.sortBy = 'priority';
    component.sortAsc = false;

    const highest = component.filteredTodos[0];
    expect(highest.priority).toBe('Critical');
  });
});
