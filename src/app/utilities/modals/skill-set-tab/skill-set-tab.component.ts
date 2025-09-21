import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-skill-set-tab',
  templateUrl: './skill-set-tab.component.html',
  styleUrls: ['./skill-set-tab.component.scss'],
})
export class SkillSetTabComponent {
  @Input() hire: any;
  @Input() selectedSkills: any[] = []; // ✅ get from parent
  @Output() skillSelectionChanged = new EventEmitter<any[]>();

  images = imageIcons;

  isChecked(skill: any): boolean {
    return this.selectedSkills.some((s) => s.jobTitle === skill.jobTitle);
  }

  onCheckboxChange(event: Event, skill: any) {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.selectedSkills = [...this.selectedSkills, skill];
    } else {
      this.selectedSkills = this.selectedSkills.filter(
        (s) => s.jobTitle !== skill.jobTitle
      );
    }
    this.skillSelectionChanged.emit(this.selectedSkills); // ✅ bubble up
  }
}
