import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-evaluation-page',
  templateUrl: './evaluation-page.component.html',
  styleUrls: ['./evaluation-page.component.scss'],
})
export class EvaluationPageComponent implements OnInit {
  @Input() scouterName!: string;

  rating = 0;
  comment = '';
  headerHidden: boolean = false;
  constructor(private modalCtrl: ModalController) {}

  ngOnInit(): void {
    // ✅ Remove the error throw
    // You can use this if you want to log who’s being rated
    console.log('Evaluating scouter:', this.scouterName);
  }

  // ⭐ Set selected star rating
  setRating(value: number) {
    this.rating = value;
  }

  // ❌ Close modal without returning data
  close() {
    this.modalCtrl.dismiss();
  }

  // ✅ Validate and submit rating data
  submitEvaluation() {
    if (this.rating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }

    this.modalCtrl.dismiss({
      rating: this.rating,
      comment: this.comment,
      scouter: this.scouterName,
    });
  }
  addLink() {
  const link = prompt('Enter link URL');
  if (link) {
    this.comment += `\n${link}`;
  }
}

addLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation not supported');
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    this.comment += `\nLocation: https://maps.google.com/?q=${lat},${lng}`;
  });
}

onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  console.log('Selected photo:', file);

  // Later: upload to server or preview
}

}
