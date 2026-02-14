export class MessageLog {
  constructor(max = 4) {
    this.max = max;
    this.messages = [{ text: 'Welcome to ASCII Depths.', color: 'default' }];
  }

  add(message, color = 'default') {
    this.messages.push({ text: message, color });
    this.messages = this.messages.slice(-this.max);
  }
}
