// skill-set-tab.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-skill-set-tab',
  templateUrl: './skill-set-tab.component.html',
  styleUrls: ['./skill-set-tab.component.scss'],
  standalone: false,
})
export class SkillSetTabComponent {
  @Input() skillSet: any[] = []; // Use API skill set instead of hire
  @Input() selectedSkills: any[] = [];
  @Output() skillSelectionChanged = new EventEmitter<any[]>();

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
    if (!amount) return 'Negotiable';
    
    // If it's already a formatted string, return it
    if (typeof amount === 'string' && amount.includes('₦')) {
      return amount;
    }
    
    // If it's a number, format it
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    
    if (isNaN(num)) {
      return typeof amount === 'string' ? amount : 'Negotiable';
    }
    
    return `₦${num.toLocaleString('en-NG')}`;
  }
}