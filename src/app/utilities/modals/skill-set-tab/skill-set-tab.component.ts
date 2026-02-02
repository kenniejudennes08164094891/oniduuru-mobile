import { Component, Input, Output, EventEmitter } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-skill-set-tab',
  templateUrl: './skill-set-tab.component.html',
  styleUrls: ['./skill-set-tab.component.scss'],
  standalone: false,
})
export class SkillSetTabComponent {
  @Input() skillSet: any[] = [];
  @Input() selectedSkills: any[] = [];
  @Output() skillSelectionChanged = new EventEmitter<any[]>();
images = imageIcons

  isChecked(skill: any): boolean {
    return this.selectedSkills.some((s) => 
      s.jobTitle === skill.jobTitle && s.skillLevel === skill.skillLevel
    );
  }

  onCheckboxChange(event: Event, skill: any) {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.selectedSkills = [...this.selectedSkills, skill];
    } else {
      this.selectedSkills = this.selectedSkills.filter(
        (s) => !(s.jobTitle === skill.jobTitle && s.skillLevel === skill.skillLevel)
      );
    }
    this.skillSelectionChanged.emit(this.selectedSkills);
  }

  formatPrice(amount: any): string {
    if (!amount || amount === 0) return 'Negotiable';
    
    if (typeof amount === 'string' && amount.includes('₦')) {
      return amount;
    }
    
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    
    if (isNaN(num)) {
      return typeof amount === 'string' ? amount : 'Negotiable';
    }
    
    return `₦${num.toLocaleString('en-NG')}`;
  }

  clearSelection() {
    this.selectedSkills = [];
    this.skillSelectionChanged.emit(this.selectedSkills);
  }
}