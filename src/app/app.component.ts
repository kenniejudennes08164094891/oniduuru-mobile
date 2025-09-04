import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { initFlowbite } from 'flowbite';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(private router:Router) {
    document.body.classList.remove('dark');
  }

  ngOnInit(): void {
    initFlowbite();
    document.body.classList.remove('dark');
  }

  toggleDarkMode() {
    // const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    // document.body.classList.toggle('dark', prefersDark.matches);
    document.body.classList.remove('dark');
  }
}
