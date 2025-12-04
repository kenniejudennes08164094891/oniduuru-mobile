  import { Component, EventEmitter, Output, Input } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';

  @Component({
    selector: 'app-other-details',
    templateUrl: './other-details.component.html',
    standalone: true, 
    imports: [CommonModule, FormsModule],
  })
  export class OtherDetailsComponent {
    @Output() next = new EventEmitter<void>();
    @Output() previous = new EventEmitter<void>();

    @Input() skillLevel = '';
    @Input() skillSet = ''; // comma-separated skills
    @Input() education = '';
    @Input() payRange = '';

    skillLevelTouched = false;
    skillSetTouched = false;
    educationTouched = false;
    payRangeTouched = false;

    newSkill = ''; // temporary input for adding skills

    skillLevels = ['Beginner', 'Intermediate', 'Expert'];
    payRanges = [
      'Less than 20k',
      '₦20,000 - ₦50,000',
      '₦50,000 - ₦100,000',
      '₦100,000 - ₦200,000',
      '₦200,000 - ₦500,000',
      '₦500,000 - ₦1,000,000',
      'Above ₦1,000,000'
    ];
    educationLevels = [
      'School drop-out',
      'SCCE',
      "Bachelor's Degree",
      "Master's Degree",
      'PhD'
    ];

    // ----------------- VALIDATIONS -----------------
    skillLevelValid() { return !!this.skillLevel; }
    skillSetValid() { return !!this.skillSet?.trim(); }
    educationValid() { return !!this.education; }
    payRangeValid() { return !!this.payRange; }
    formValid() { return this.skillLevelValid() && this.skillSetValid() && this.educationValid() && this.payRangeValid(); }

    // ----------------- HANDLERS -----------------
    addSkill() {
      if (!this.newSkill.trim()) return;
      const skills = this.skillSet ? this.skillSet.split(',') : [];
      skills.push(this.newSkill.trim());
      this.skillSet = skills.join(', ');
      this.newSkill = '';
      this.skillSetTouched = true;
    }

    removeSkill(index: number) {
      const skills = this.skillSet.split(',');
      skills.splice(index, 1);
      this.skillSet = skills.join(', ');
    }

    onNext() {
      this.skillLevelTouched = true;
      this.skillSetTouched = true;
      this.educationTouched = true;
      this.payRangeTouched = true;
      if (this.formValid()) this.next.emit();
    }

    onPrevious() {
      this.previous.emit();
    }
  }
