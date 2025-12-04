import { Component, Input, OnInit} from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';



@Component({
  selector: 'app-evaluation-page',
  templateUrl: './evaluation-page.component.html',
  styleUrls: ['./evaluation-page.component.scss'],
})
export class EvaluationPageComponent  implements OnInit {
   @Input() scouterName!: string;          // e.g. "Omoshein Kehinde Jude"
  @Input() jobDescription!: string;       // e.g. "I need a software dev for my startup"

  form!: FormGroup;
  headerHidden: boolean = false;


   constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      comment: ['', [Validators.required, Validators.minLength(5)]],
      rating: [0, [Validators.min(1)]],
    });
  }
  ngOnInit() {}

  dismiss(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  setRating(value: number) {
    this.form.patchValue({ rating: value });
  }

  submit() {
    if (this.form.invalid) return;

    this.dismiss({
      comment: this.form.value.comment,
      rating: this.form.value.rating,
    });
  }

  get isSubmitDisabled(): boolean {
    return this.form.invalid;
  }
}