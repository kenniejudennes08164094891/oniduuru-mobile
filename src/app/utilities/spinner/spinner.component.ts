import {Component, Input, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SpinnerComponent implements OnInit{
  @Input() loadingText: string = 'Loading';
  isLoading: boolean = true;
  ngOnInit() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.isLoading = false;
      }, 2000);
    });
  }
}
