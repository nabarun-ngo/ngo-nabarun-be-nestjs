


export class SlackNotificationRequestEvent {
    constructor(
        public readonly message: string,
        public readonly type: 'error' | 'warning' | 'info' = 'error',
    ) {
    }
}