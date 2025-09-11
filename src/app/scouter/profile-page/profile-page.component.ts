import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { IonContent, ModalController } from '@ionic/angular'; // 👈 add this
import { UpdateProfileConfirmationPopupModalComponent } from 'src/app/utilities/modals/update-profile-confirmation-popup-modal/update-profile-confirmation-popup-modal.component';


interface SecurityQA {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  headerHidden: boolean = false;
  profileImage: string | ArrayBuffer | null = null;

  showQuestions: boolean = false;
  securityQuestions: SecurityQA[] = [];

  @ViewChild(IonContent) pageContent!: IonContent; // 👈 ion-content reference
  @ViewChild('profilePicture') profilePicture!: ElementRef;
  @ViewChild('securityQuestionsSection') securityQuestionsSection!: ElementRef;

  constructor(
    private router: Router,
    private location: Location,
    private modalCtrl: ModalController // 👈 add this
  ) {}
  ngOnInit() {}

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goBack() {
    this.location.back();
  }

  toggleQuestions() {
    this.showQuestions = !this.showQuestions;
  }

  addQuestion() {
    if (this.securityQuestions.length < 5) {
      this.securityQuestions.push({ question: '', answer: '' });
    }
  }

  formatNumber(event: any) {
    let input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    input.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  scrollToProfilePicture() {
    const y = this.profilePicture.nativeElement.offsetTop;
    this.pageContent.scrollToPoint(0, y, 600); // 👈 smooth scroll inside ion-content
  }

  scrollToSecurityQuestions() {
    //this.showQuestions = true; // open inputs
    const y = this.securityQuestionsSection.nativeElement.offsetTop;
    this.pageContent.scrollToPoint(0, y, 600);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.profileImage = reader.result as string; // base64 string
        console.log('Base64 image:', this.profileImage); // you can send this to API
      };

      reader.readAsDataURL(file);
    }
  }

  // 👇 function to open modal
  async openConfirmationPopup() {
    const modal = await this.modalCtrl.create({
      component: UpdateProfileConfirmationPopupModalComponent,
      cssClass: 'update-profile-modal',
    });
    await modal.present();
  }
}
