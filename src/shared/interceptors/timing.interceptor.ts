import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { tap } from "rxjs";
import { getTraceId } from "../utils/trace-context.util";

@Injectable()
export class TimingInterceptor implements NestInterceptor {
    intercept(ctx: ExecutionContext, next: CallHandler) {
        const start = Date.now();
        return next.handle().pipe(
            tap(() => {
                const req = ctx.switchToHttp().getRequest();
                console.log(
                    `[TimingInterceptor] [${getTraceId() || 'no-trace'}] ${req.method} ${req.url} ${Date.now() - start}ms`
                );
            }),
        );
    }
}
