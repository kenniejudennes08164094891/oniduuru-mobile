import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, IonTitle } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-signup-select',
  templateUrl: './signup-select.component.html',
  styleUrls: ['./signup-select.component.scss'],
  imports: [IonicModule],
  standalone: true,
})
export class SignupSelectComponent implements OnInit {

  talentImage = imageIcons.talentImage;
  scouterImage = imageIcons.scouterImage;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() { }
  // 'create-account',

  routeToTalentSignup(){
   setTimeout(() => {
    this.router.navigate(['/talent/onboarding'], {relativeTo: this.route});
   }, 200)
  }

  routeToScouterSignup(){
   setTimeout(() => {
     this.router.navigate(['/scouter/create-account'], {relativeTo: this.route});
   },200)
  }

}
