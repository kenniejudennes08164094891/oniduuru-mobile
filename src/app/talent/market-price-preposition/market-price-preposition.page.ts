import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-market-price-preposition',
  templateUrl: './market-price-preposition.page.html',
  styleUrls: ['./market-price-preposition.page.scss'],
})
export class MarketPricePrepositionPage implements OnInit {
  headerHidden = false;
  hireId!: string;
  transaction: any;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    const hireId = this.route.snapshot.paramMap.get('id')|| '';
    console.log('Viewing transaction for hire:', this.hireId);
    // Mock example — later fetch from API or service
    this.transaction = {
      id: hireId,
      jobDescription: 'I need a software dev for my startup.',
      amount: 700000,
      dateOfHire: '17/Sept/2024: 8:15am',
      scouterComment: 'Jude did a Great work',
      status: 'Offer Accepted',
      talentEmail: 'kehindejude1995@gmail.com',
      startDate: 'Jan 1, 2025',
      talentComment: 'N/A'
    };
  }
 MockRecentHires = [
    { id: 1, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000 },
    { id: 2, name: 'Yamine Yamal', email: 'jane@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 780000 },
    { id: 3, name: 'Christiano Ronaldo', email: 'mike@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 390000 },
    { id: 4, name: 'Andre Messi', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 800000 },
    { id: 5, name: 'Elon Musk', email: 'jane@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 70050 },
    { id: 6, name: 'Mike Johnson', email: 'mike@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 300000 },
    { id: 7, name: 'Jane Smith', email: 'jane@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 750000 },
    { id: 8, name: 'Mike Johnson', email: 'mike@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 4000000 },
    { id: 9, name: 'Sam sam', email: 'john@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 3000000 },
    { id: 10, name: 'Seyi seyi', email: 'jane@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 2750000 },
    { id: 11, name: 'Seyi ade', email: 'mike@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 3785900 },
    { id: 12, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000 },
    { id: 13, name: 'Yamine Yamal', email: 'jane@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 780000 },
    { id: 14, name: 'Christiano Ronaldo', email: 'mike@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 390000 },
    { id: 15, name: 'Andre Messi', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 800000 },
    { id: 16, name: 'Mike Johnson', email: 'mike@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 300000 },
    { id: 17, name: 'Jane Smith', email: 'jane@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 750000 },
    { id: 18, name: 'Mike Johnson', email: 'mike@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 4000000 },
    { id: 19, name: 'Sam sam', email: 'john@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 3000000 },
    { id: 20, name: 'Seyi seyi', email: 'jane@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 2750000 },
    { id: 21, name: 'Elon Musk', email: 'jane@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 70050 },
  ];
}
