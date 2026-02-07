import { mutation, action, internalMutation } from "../../../../../../convex/_generated/server";
import { v } from "convex/values";
import { internal, components } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";

const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

// =============================================================================
// Request Magic Link
// =============================================================================

/**
 * Request a magic link to be sent to the user's email.
 * Creates a token and triggers email sending.
 */
export const requestMagicLink = action({
    args: {
        email: v.string(),
        appOrigin: v.string(),
        returnPath: v.optional(v.string()),
        appId: v.string(),
    },
    handler: async (ctx, { email, appOrigin, returnPath, appId }) => {
        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // Generate secure token
        const token = generateSecureToken();
        const now = Date.now();

        // Store the magic link token
        await ctx.runMutation(internal.auth.magicLink.storeMagicLink, {
            email: normalizedEmail,
            token,
            appOrigin,
            returnPath: returnPath || "/",
            appId,
            createdAt: now,
            expiresAt: now + MAGIC_LINK_EXPIRY_MS,
        });

        // Build magic link URL
        const magicLinkUrl = `${appOrigin}/auth/magic-link?token=${token}`;

        // Send email
        await sendMagicLinkEmail(normalizedEmail, magicLinkUrl);

        return {
            success: true,
            message: "Magic link sent to your email",
        };
    },
});

/**
 * Internal mutation to store magic link token.
 */
export const storeMagicLink = internalMutation({
    args: {
        email: v.string(),
        token: v.string(),
        appOrigin: v.string(),
        returnPath: v.string(),
        appId: v.string(),
        createdAt: v.number(),
        expiresAt: v.number(),
    },
    handler: async (ctx, args) => {
        // Create new magic link via auth component
        await ctx.runMutation(components.auth.mutations.createMagicLink, {
            email: args.email,
            token: args.token,
            appOrigin: args.appOrigin,
            returnPath: args.returnPath,
            appId: args.appId,
            expiresAt: args.expiresAt,
        });
    },
});

// =============================================================================
// Verify Magic Link
// =============================================================================

/**
 * Verify a magic link token and create a session.
 */
export const verifyMagicLink = action({
    args: {
        token: v.string(),
    },
    handler: async (ctx, { token }): Promise<{
        success: boolean;
        error?: string;
        sessionToken?: string;
        user?: { id: string; email: string; name?: string; role: string };
        isNewUser?: boolean;
        returnPath?: string;
        appOrigin?: string;
    }> => {
        // Get and validate the magic link via auth component
        const magicLink = await ctx.runMutation(
            internal.auth.magicLink.consumeMagicLink,
            { token }
        );

        if (!magicLink) {
            return {
                success: false,
                error: "Invalid or expired magic link",
            };
        }

        // Find or create user
        const result = await ctx.runMutation(
            internal.auth.magicLink.findOrCreateUser,
            { email: magicLink.email }
        );

        // Create session
        const sessionToken: string = await ctx.runMutation(
            internal.auth.sessions.createSession,
            {
                userId: result.userId,
                provider: "magic-link",
                appId: magicLink.appId,
            }
        );

        return {
            success: true,
            sessionToken,
            user: result.user,
            isNewUser: result.isNewUser,
            returnPath: magicLink.returnPath,
            appOrigin: magicLink.appOrigin,
        };
    },
});

/**
 * Internal mutation to consume (use) a magic link token.
 * Delegates to auth component's consumeMagicLink mutation.
 */
export const consumeMagicLink = internalMutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, { token }) => {
        // Consume the magic link via auth component
        const magicLink = await ctx.runMutation(
            components.auth.mutations.consumeMagicLink,
            { token }
        );

        if (!magicLink) {
            return null;
        }

        return {
            email: magicLink.email,
            appOrigin: magicLink.appOrigin,
            returnPath: magicLink.returnPath,
            appId: magicLink.appId,
        };
    },
});

/**
 * Internal mutation to find or create a user by email.
 */
export const findOrCreateUser = internalMutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, { email }): Promise<{
        userId: Id<"users">;
        user: { id: string; email: string; name?: string; role: string };
        isNewUser: boolean;
    }> => {
        // Try to find existing user
        let user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        let isNewUser = false;

        if (!user) {
            // Create new user
            isNewUser = true;
            const userId = await ctx.db.insert("users", {
                email,
                role: "member",
                status: "active",
                metadata: { provider: "magic-link" },
                lastLoginAt: Date.now(),
            });
            user = await ctx.db.get(userId);
        } else {
            // Update last login
            await ctx.db.patch(user._id, { lastLoginAt: Date.now() });
        }

        return {
            userId: user!._id,
            user: {
                id: String(user!._id),
                email: user!.email,
                name: user!.name,
                role: user!.role,
            },
            isNewUser,
        };
    },
});

// =============================================================================
// Helpers
// =============================================================================

function generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
        ""
    );
}

/**
 * Send magic link email using Resend.
 * Falls back to console.log in development if RESEND_API_KEY is not set.
 */
async function sendMagicLinkEmail(
    email: string,
    magicLinkUrl: string
): Promise<void> {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
        // Development fallback - log to console
        console.log("=== MAGIC LINK EMAIL (dev mode) ===");
        console.log("To:", email);
        console.log("Link:", magicLinkUrl);
        console.log("===================================");
        return;
    }

    const fromEmail = process.env.EMAIL_FROM || "noreply@digilist.no";
    const fromName = process.env.EMAIL_FROM_NAME || "Digilist";

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [email],
            subject: "Logg inn pa Digilist",
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0064B4; margin: 0;">DIGILIST</h1>
        <p style="color: #666; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 2px;">ENKEL BOOKING</p>
    </div>

    <h2 style="color: #333; margin-bottom: 20px;">Logg inn med lenke</h2>

    <p>Klikk pa knappen under for a logge inn pa Digilist:</p>

    <div style="text-align: center; margin: 30px 0;">
        <a href="${magicLinkUrl}"
           style="background-color: #0064B4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Logg inn
        </a>
    </div>

    <p style="color: #666; font-size: 14px;">
        Eller kopier denne lenken til nettleseren din:<br>
        <a href="${magicLinkUrl}" style="color: #0064B4; word-break: break-all;">${magicLinkUrl}</a>
    </p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

    <p style="color: #999; font-size: 12px;">
        Denne lenken utloper om 15 minutter. Hvis du ikke ba om denne e-posten, kan du trygt ignorere den.
    </p>

    <p style="color: #999; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Digilist. Alle rettigheter reservert.
    </p>
</body>
</html>
            `,
            text: `Logg inn pa Digilist\n\nKlikk pa lenken under for a logge inn:\n${magicLinkUrl}\n\nDenne lenken utloper om 15 minutter.\n\nHvis du ikke ba om denne e-posten, kan du trygt ignorere den.`,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Failed to send magic link email:", error);
        throw new Error("Failed to send magic link email");
    }
}
