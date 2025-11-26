import { Controller, Get, Header, Logger, Query, Res } from "@nestjs/common";
import { Public } from "src/modules/shared/auth/application/decorators/public.decorator";
import { GoogleOAuthService } from "src/modules/shared/auth/application/services/google-oauth.service";
import type { Response } from "express";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { renderOAuthCallback } from "../utilities/oauth-template.utility";
import { IgnoreCaptchaValidation } from "src/modules/shared/auth/application/decorators/ignore-captcha.decorator";


@Controller('callback')
@Public()
export class CallbackController {
    private readonly logger = new Logger(CallbackController.name);

    constructor(
        private readonly oAuthService: GoogleOAuthService,
    ) { }

    /**
     * Backend callback endpoint - Google redirects here directly
     * This is the SECURE approach - code never exposed to frontend
     * Returns HTML page directly (no redirect to frontend)
     */
    @Get('oauth/google')
    @Public()
    @IgnoreCaptchaValidation()
    @Header('Content-Type', 'text/html')
    async handleGmailCallbackRedirect(
        @Query('code') code: string | undefined,
        @Query('state') state: string | undefined,
        @Query('error') error: string | undefined,
        @Res() res: Response,
    ) {
        // Handle OAuth errors (user denied, etc.)
        if (error || !code || !state) {
            this.logger.warn(`OAuth callback error: ${error || 'Missing code or state'}`);

            const errorMessage = error === 'access_denied'
                ? 'You denied the authorization request. Please grant the required permissions to continue.'
                : error || 'Missing authorization code or state parameter.';

            const html = renderOAuthCallback({
                isSuccess: false,
                message: errorMessage,
                reason: error || 'missing_parameters',
                description: 'The OAuth authorization process was not completed successfully.',
            });

            return res.send(html);
        }

        // Rate limiting - use code as identifier (codes are unique)
        try {
            await this.oAuthService.checkRateLimit(code);
        } catch (rateLimitError) {
            this.logger.warn(`Rate limit exceeded for OAuth callback`);
            const html = renderOAuthCallback({
                isSuccess: false,
                message: 'Too many requests. Please wait a moment and try again.',
                reason: 'rate_limit_exceeded',
                description: 'You have exceeded the rate limit for OAuth callbacks. Please try again in a minute.',
            });
            return res.send(html);
        }

        try {
            // Process callback with state validation and code reuse prevention
            const result = await this.oAuthService.handleCallback(code, state);

            if (result.success) {
                // Get email from the result if available
                const email = result.email;

                this.logger.log(`OAuth callback successful for email: ${email || 'unknown'}`);

                const html = renderOAuthCallback({
                    isSuccess: true,
                    title: 'Authorization Successful!',
                    message: 'Your Google account has been successfully connected.',
                    description: 'You can now use authorized features in the application.',
                    email: email,
                });

                return res.send(html);
            } else {
                const html = renderOAuthCallback({
                    isSuccess: false,
                    message: result.error || 'Failed to process OAuth callback.',
                    reason: 'processing_failed',
                    description: 'We encountered an error while processing your authorization. Please try again.',
                });
                return res.send(html);
            }
        } catch (error) {
            this.logger.error(`OAuth callback processing failed: ${error.message}`);

            let errorMessage = 'An unexpected error occurred while processing your authorization.';
            let reason = 'processing_failed';

            if (error instanceof BadRequestException) {
                errorMessage = error.message;
                reason = 'invalid_request';
            } else if (error instanceof UnauthorizedException) {
                errorMessage = error.message;
                reason = 'unauthorized';
            }

            const html = renderOAuthCallback({
                isSuccess: false,
                message: errorMessage,
                reason: reason,
                description: 'Please try the authorization process again. If the problem persists, contact support.',
            });

            return res.send(html);
        }
    }


}