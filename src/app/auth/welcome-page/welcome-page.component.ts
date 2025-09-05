import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IonicModule } from "@ionic/angular";
import { MatToolbarModule } from "@angular/material/toolbar";
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-welcome-page',
  templateUrl: './welcome-page.component.html',
  styleUrls: ['./welcome-page.component.scss'],
  imports: [IonicModule, MatIconModule, MatToolbarModule],
  standalone: true
})
export class WelcomePageComponent implements AfterViewInit {

  @ViewChild('textAnimation') textAnimation!: ElementRef;
  constructor(
    private router:Router,
    private route: ActivatedRoute
  ) { }

  animateText(){
  const textElement = this.textAnimation.nativeElement;
  const text = "Oniduuru Marketplace";
  let index = 0;
  const typingEffect = setInterval(() => {
    textElement.textContent += text[index];
    index++;
    if (index === text.length) {
      clearInterval(typingEffect);
    }
  }, 150); // Adjust the speed of typing here (in milliseconds)
}

async signupSelect():Promise<any>{
  await this.router.navigate(['/auth/signup-select'], {relativeTo: this.route});
}

async routeToLoginScreen():Promise<any>{
   await this.router.navigate(['/auth/login'],{
      relativeTo: this.route
    })
}


ngAfterViewInit(): void {
  this.animateText();
}


}
