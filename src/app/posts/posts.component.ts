import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.scss'
})
export class PostsComponent implements OnInit {
  private http = inject(HttpClient);
  private modalService = inject(NgbModal);
  private modalHistory = inject(ModalHistoryService);

  posts: Post[] = [];
  loading = true;

  ngOnInit() {
    this.http.get<Post[]>('https://jsonplaceholder.typicode.com/posts')
      .subscribe({
        next: (data) => {
          this.posts = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching posts', err);
          this.loading = false;
        }
      });
  }

  openInfo(content: TemplateRef<any>) {
    const modalRef = this.modalService.open(content, {
      backdropClass: 'bg-transparent',
      fullscreen: 'sm'
    });
    this.modalHistory.registerModal(modalRef);
  }
}
