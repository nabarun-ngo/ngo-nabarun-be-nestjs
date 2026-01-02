import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { tap } from "rxjs";

@Injectable()
export class TimingInterceptor implements NestInterceptor {
    intercept(ctx: ExecutionContext, next: CallHandler) {
        const start = Date.now();
        return next.handle().pipe(
            tap(() => {
                const req = ctx.switchToHttp().getRequest();
                console.log(
                    `[TimingInterceptor] ${req.method} ${req.url} ${Date.now() - start}ms`
                );
            }),
        );
    }
}
