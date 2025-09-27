import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { AnimationController } from '@ionic/angular';

@Component({
  selector: 'app-welcome-to-oniduuru-marketplace-page',
  templateUrl: './welcome-to-oniduuru-marketplace-page.component.html',
  styleUrls: ['./welcome-to-oniduuru-marketplace-page.component.scss'],
  standalone: false,
})
export class WelcomeToOniduuruMarketplacePageComponent implements OnInit {
  constructor(
    private router: Router,
    private navCtrl: NavController,
    private toast: ToastController,
    private animationCtrl: AnimationController
  ) {}

  ngOnInit() {}

  goTOViewAllTalents() {
    this.navCtrl.navigateForward(
      '/scouter/hire-talent/welcome-to-oniduuru/view-all-talents',
      {
        animated: true,
        animation: (baseEl, opts) => {
          const animation = this.animationCtrl
            .create()
            .addElement(baseEl.querySelector('.ion-page'))
            .duration(400)
            .fromTo('opacity', '0', '1');

          return animation;
        },
      }
    );
  }
}
