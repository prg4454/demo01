import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TodosEntryModalComponent } from './todos-entry-modal.component';
import { TodoRecord } from './todo.model';
import { ModalHistoryService } from '../modal-history.service';

describe('TodosEntryModalComponent', () => {
  let component: TodosEntryModalComponent;
  let fixture: ComponentFixture<TodosEntryModalComponent>;

  const mockTodo: TodoRecord = {
    id: 999,
    title: 'Test Task',
    category: 'Work',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-09-01',
    assignedTo: 'Tester',
    comments: 'Sample test comments'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodosEntryModalComponent],
      providers: [
        NgbActiveModal,
        ModalHistoryService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TodosEntryModalComponent);
    component = fixture.componentInstance;
    component.todo = mockTodo;
    fixture.detectChanges();
  });

  it('should create the modal component', () => {
    expect(component).toBeTruthy();
    expect(component.editDraft).toBeTruthy();
    expect(component.editDraft?.title).toBe('Test Task');
  });

  it('should validate required fields', () => {
    expect(component.canSave()).toBeTrue();
    if (component.editDraft) {
      component.editDraft.title = '';
      expect(component.canSave()).toBeFalse();
    }
  });

  it('should detect unsaved changes', () => {
    expect(component.hasUnsavedChanges()).toBeFalse();
    if (component.editDraft) {
      component.editDraft.title = 'Modified Task Title';
      expect(component.hasUnsavedChanges()).toBeTrue();
      const changes = component.getUnsavedChanges();
      expect(changes.length).toBe(1);
      expect(changes[0].label).toBe('Title');
      expect(changes[0].before).toBe('Test Task');
      expect(changes[0].after).toBe('Modified Task Title');
    }
  });

  it('should allow dismiss when no unsaved changes', async () => {
    const shouldDismiss = await component.handleBeforeDismiss();
    expect(shouldDismiss).toBeTrue();
  });
});
