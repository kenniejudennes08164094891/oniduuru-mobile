// src/app/components/chat-bot/chat-bot.component.ts
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { ChatVisibilityService } from '../../services/chat-visibility.service';
import { imageIcons } from 'src/app/models/stores';
import { AuthService } from '../../services/auth.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-bot',
  templateUrl: './chat-bot.component.html',
  styleUrls: ['./chat-bot.component.scss'],
})
export class ChatBotComponent implements AfterViewChecked, OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('chatButton') private chatButton!: ElementRef;

  images = imageIcons;
  isOpen = false;
  newMessage = '';
  messages: ChatMessage[] = [];
  isLoading = false;

  // Draggable properties
  position = { x: 0, y: 0 };
  isDragging = false;
  dragStartPosition = { x: 0, y: 0 };

  // Update these properties - remove chatVisibilityService dependency
  showChatButton = false;
  private routerSubscription?: Subscription;
  private authSubscription?: Subscription;
  // Remove this subscription since we're not using the service for visibility anymore
  // private chatVisibilitySubscription?: Subscription;

  constructor(
    private chatService: ChatService,
    private router: Router,
    private authService: AuthService,
    private chatVisibilityService: ChatVisibilityService // Keep for other potential uses
  ) {}

  ngOnInit() {
    this.loadPositionFromStorage();
    this.checkAuthenticationStatus();
    this.setupRouterListener();
    // Remove this - we're handling visibility via router now
    // this.setupChatVisibilityListener();
    this.loadMessages();
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    // Remove this
    // if (this.chatVisibilitySubscription) {
    //   this.chatVisibilitySubscription.unsubscribe();
    // }
  }

  // Remove this method entirely
  /*
  private setupChatVisibilityListener() {
    this.chatVisibilitySubscription =
      this.chatVisibilityService.isFloatingButtonVisible$.subscribe(
        (isVisible) => {
          const isAuthenticated = this.authService.validateStoredToken();
          const isOnAuthPage = this.isOnAuthPage(this.router.url);
          this.showChatButton = isVisible && isAuthenticated && !isOnAuthPage;
        }
      );
  }
  */

  // Check if user is authenticated and update chat button visibility
  private checkAuthenticationStatus() {
    const isAuthenticated = this.authService.validateStoredToken();

    this.authSubscription = this.authService.userLoggedIn$.subscribe(
      (loggedIn) => {
        const isOnAuthPage = this.isOnAuthPage(this.router.url);
        const isOnChatPage = this.isOnChatPage(this.router.url);

        // Show button only when: authenticated + not on auth pages + not on chat page
        this.showChatButton = loggedIn && !isOnAuthPage && !isOnChatPage;
      }
    );

    // Initial check
    const isOnAuthPage = this.isOnAuthPage(this.router.url);
    const isOnChatPage = this.isOnChatPage(this.router.url);
    this.showChatButton = isAuthenticated && !isOnAuthPage && !isOnChatPage;
  }

  // Listen to route changes to hide chat button on auth pages AND chat page
  private setupRouterListener() {
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.handleRouteChange(event.url);
      });

    // Initial check for current route
    this.handleRouteChange(this.router.url);
  }

  private handleRouteChange(url: string) {
    const isOnAuthPage = this.isOnAuthPage(url);
    const isOnChatPage = this.isOnChatPage(url);
    const isAuthenticated = this.authService.validateStoredToken();

    // Show button only when: authenticated + not on auth pages + not on chat page
    this.showChatButton = isAuthenticated && !isOnAuthPage && !isOnChatPage;
  }

  private isOnAuthPage(url: string): boolean {
    const hiddenRoutes = [
      '/auth',
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/welcome-page',
      '/talent/onboarding',
    ];
    return hiddenRoutes.some((route) => url.startsWith(route));
  }

  // NEW METHOD: Check if current route is a chat page
  private isOnChatPage(url: string): boolean {
    const chatRoutes = ['/chat', '/scouter/chat', '/talent/chat'];
    return chatRoutes.some((route) => url.startsWith(route));
  }

  // Simply navigate to the full chat page
  openChat() {
    if (this.showChatButton) {
      this.router.navigate(['/chat']);
    }
  }

  // ... rest of your existing methods (draggable functionality, chat methods, etc.) remain the same
  // [Keep all your existing draggable methods and chat methods here]

  onMouseDown(event: MouseEvent) {
    if (this.showChatButton) {
      event.preventDefault();
      this.isDragging = true;
      this.dragStartPosition = {
        x: event.clientX - this.position.x,
        y: event.clientY - this.position.y,
      };
    }
  }

  onTouchStart(event: TouchEvent) {
    if (this.showChatButton) {
      event.preventDefault();
      const touch = event.touches[0];
      this.isDragging = true;
      this.dragStartPosition = {
        x: touch.clientX - this.position.x,
        y: touch.clientY - this.position.y,
      };
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      this.position.x = event.clientX - this.dragStartPosition.x;
      this.position.y = event.clientY - this.dragStartPosition.y;
      this.constrainToViewport();
    }
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (this.isDragging) {
      const touch = event.touches[0];
      this.position.x = touch.clientX - this.dragStartPosition.x;
      this.position.y = touch.clientY - this.dragStartPosition.y;
      this.constrainToViewport();
      event.preventDefault();
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.savePositionToStorage();
    }
  }

  @HostListener('document:touchend')
  onTouchEnd() {
    if (this.isDragging) {
      this.isDragging = false;
      this.savePositionToStorage();
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.constrainToViewport();
    this.savePositionToStorage();
  }

  private constrainToViewport() {
    const buttonWidth = 56;
    const buttonHeight = 56;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 8;
    this.position.x = Math.max(
      padding,
      Math.min(this.position.x, viewportWidth - buttonWidth - padding)
    );
    this.position.y = Math.max(
      padding,
      Math.min(this.position.y, viewportHeight - buttonHeight - padding)
    );
  }

  private loadPositionFromStorage() {
    const savedPosition = localStorage.getItem('chatButtonPosition');
    if (savedPosition) {
      this.position = JSON.parse(savedPosition);
    } else {
      this.position = { x: window.innerWidth - 72, y: window.innerHeight - 72 };
    }
  }

  private savePositionToStorage() {
    localStorage.setItem('chatButtonPosition', JSON.stringify(this.position));
  }

  resetPosition() {
    this.position = { x: window.innerWidth - 72, y: window.innerHeight - 72 };
    this.savePositionToStorage();
  }

  isInDefaultPosition(): boolean {
    const defaultX = window.innerWidth - 72;
    const defaultY = window.innerHeight - 72;
    const tolerance = 5;
    return (
      Math.abs(this.position.x - defaultX) <= tolerance &&
      Math.abs(this.position.y - defaultY) <= tolerance
    );
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  loadMessages() {
    this.messages = this.chatService.getMessages();
    if (this.messages.length === 0) {
      this.addWelcomeMessage();
    }
  }

  private addWelcomeMessage() {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      text: 'Bàwo ni! I\'m Òní Ìbéèrè – your ever-curious AI companion. Go ahead, ask me anything... maybe start with "Who is Wizkid?"',
      sender: 'bot',
      timestamp: new Date(),
    };
    this.messages.push(welcomeMessage);
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;

    const userMessage = await this.chatService.addMessage(
      this.newMessage,
      'user'
    );
    this.messages.push(userMessage);

    const userText = this.newMessage;
    this.newMessage = '';
    this.isLoading = true;

    try {
      const botResponse = await this.chatService.sendToChatbot(userText);
      const botMessage = await this.chatService.addMessage(botResponse, 'bot');
      this.messages.push(botMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = await this.chatService.addMessage(
        'Sorry, I encountered an error. Please try again.',
        'bot'
      );
      this.messages.push(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
