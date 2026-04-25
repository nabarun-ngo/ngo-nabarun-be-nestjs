import { NotificationCategory, NotificationPriority, NotificationType } from "../../domain/models/notification.model";
import { NotificationKeys } from "src/shared/notification-keys";

export class SendNotificationRequestEvent {
    public readonly targetUserIds: string[];
    public readonly notificationKey: NotificationKeys;
    public readonly data: Record<string, any>;
    public readonly type: NotificationType;
    public readonly category: NotificationCategory;
    public readonly priority: NotificationPriority;
    public readonly referenceId?: string;
    public readonly referenceType?: string;
    public readonly sendPush: boolean;

    constructor(op: {
        targetUserIds: string[],
        notificationKey: NotificationKeys,
        type: NotificationType,
        category: NotificationCategory,
        data: Record<string, any>,
        referenceId?: string,
        referenceType?: string,
        priority?: NotificationPriority,
        sendPush?: boolean
    }) {
        this.targetUserIds = op.targetUserIds;
        this.notificationKey = op.notificationKey;
        this.data = op.data;
        this.type = op.type;
        this.category = op.category;
        this.priority = op.priority || NotificationPriority.NORMAL;
        this.referenceId = op.referenceId;
        this.referenceType = op.referenceType;
        this.sendPush = op.sendPush || true;
    }
}