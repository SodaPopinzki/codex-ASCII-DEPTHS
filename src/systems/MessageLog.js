export class MessageLog {
  constructor(max = 4) {
    this.max = max;
    this.messages = [];
    this.history = [];
    this.add('Welcome to ASCII Depths.', 'info');
  }

  add(message, color = 'info') {
    const entry = { text: message, color };
    this.history.push(entry);
    this.messages.push(entry);
    this.messages = this.messages.slice(-this.max);
  }
}
