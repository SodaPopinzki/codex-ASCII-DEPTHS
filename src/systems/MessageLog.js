export class MessageLog {
  constructor(max = 4) {
    this.max = max;
    this.messages = ['Welcome to ASCII Depths.'];
  }

  add(message) {
    this.messages.push(message);
    this.messages = this.messages.slice(-this.max);
  }
}
