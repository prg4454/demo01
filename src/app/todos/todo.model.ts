export type TodoCategory = 'Work' | 'Personal' | 'Finance' | 'Health' | 'Home' | 'Development' | 'General';
export type TodoPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TodoStatus = 'Pending' | 'In Progress' | 'Completed' | 'Deferred';

export interface TodoRecord {
  id: number;
  title: string;
  category: TodoCategory;
  priority: TodoPriority;
  status: TodoStatus;
  dueDate: string;
  assignedTo: string;
  comments: string;
}

export interface TodosModalResult {
  action: 'save' | 'delete';
  todo: TodoRecord;
}

